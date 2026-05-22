import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const lessons = [
  { num: 1, title: 'М. Булгаковтың «Ит жүрегі» повесінің тақырыбы мен идеясы' },
  { num: 2, title: '«Ит жүрегі» повесінің кейіпкерлері' },
  { num: 3, title: 'Ғ.Бекахметовтің «Барсакелмес. Көшпенділердің оралуы» шығармасының тақырыбы мен идеясы' },
  { num: 4, title: 'Ғ.Бекахметовтің «Барсакелмес. Көшпенділердің оралуы» шығармасындағы кейіпкерлер' }
];

const school1Name = 'Астана қаласы №51 мектеп-гимназиясы';
const teachers1Data = [
  { name: 'Муратова Индира Жарқынбекқызы', email: 'muratova@example.com' },
  { name: 'Сабденова Кулиза Кудайбергеновна', email: 'sabdenova@example.com' },
  { name: 'Дәулет Мадина Әбубакірқызы', email: 'daulet.madina@example.com' },
  { name: 'Бимуратова Гульмира Нурбергеновна', email: 'bimuratova@example.com' }
];

const school2Name = 'Алматы қаласы Жетісу ауданы №2 мектеп';
const teachers2Data = [
  { name: 'Сүлеймнова Гүлнар Зинабытқызы', email: 'suleimenova@example.com' },
  { name: 'Туралиева Гүлмира Мырзабаевна', email: 'turalieva@example.com' },
  { name: 'Умбетова Жанат Кулпыбаевна', email: 'umbetova@example.com' },
  { name: 'Мырзабаева Идаят Бектасовна', email: 'myrzabaeva@example.com' }
];

function getExtensiveFeedback(lessonTitle, teacherName, evaluatorName) {
  const strengths = [
    `Мұғалім сабақ барысында "${lessonTitle}" тақырыбын ашуда жаңа инновациялық әдістерді өте тиімді қолданды.`,
    `Оқушылардың белсенділігін арттыру мақсатында топтық жұмыстар өте жоғары деңгейде ұйымдастырылды.`,
    `Сабақтың тақырыбы мен идеясы толық ашылып, оқушылар талдау жұмыстарына белсене қатысты.`,
    `Мұғалім әр оқушының пікіріне құрметпен қарап, олардың сыни ойлау дағдыларын дамытуға баса назар аударды.`,
    `Кері байланыс уақытылы және сындарлы түрде берілгендіктен, оқушылар өз қателіктерін тез түсінді.`,
    `Сабақ жоспары толығымен жүзеге асырылып, күтілетін нәтижелерге толығымен қол жеткізілді.`
  ].join(' ');

  const improvement = [
    `Болашақта сабақ барысында уақытты тиімді жоспарлауға көбірек көңіл бөлу ұсынылады.`,
    `Топтық жұмыстарда кейбір белсенді емес оқушыларды тартудың жаңа белсенді тәсілдерін қарастырған жөн.`,
    `Сабақтың қорытынды бөлімінде өзін-өзі бағалау парақшаларын қолдану тиімділікті арттыра түседі.`,
    `Оқушылардың шығармашылық әлеуетін ашу үшін қосымша электронды ресурстарды қолдануды ұсынамын.`,
    `Теориялық материалдарді өмірмен байланыстыратын практикалық тапсырмаларды көбейткен дұрыс болады.`,
    `Сабақтан тыс уақытта оқушылармен жеке дара жұмыс жүргізу деңгейін арттыру қажет.`
  ].join(' ');

  return { strengths, improvement };
}

async function reseed() {
  console.log("Cleaning up old teacher evaluations...");
  const { error: deleteErr } = await supabase
    .from('teacher_evaluations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteErr) {
    console.error("Error clearing evaluations table:", deleteErr);
    return;
  }

  // 1. Seed School 1 & its Teachers
  console.log(`Processing School 1: ${school1Name}`);
  let { data: school1 } = await supabase.from('schools').select('*').eq('name', school1Name).single();
  if (!school1) {
    const res = await supabase.from('schools').insert({ name: school1Name }).select().single();
    school1 = res.data;
  }

  const users1 = {};
  for (const t of teachers1Data) {
    let { data: existingUser } = await supabase.from('users').select('*').eq('email', t.email).single();
    if (!existingUser) {
      console.log(`Creating user: ${t.name}`);
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: t.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { name: t.name, role: 'teacher' }
      });
      if (authErr) {
        console.error("Error creating auth user:", authErr);
        continue;
      }
      await supabase.from('users').update({ school_id: school1.id }).eq('id', authUser.user.id);
      let { data: newUser } = await supabase.from('users').select('*').eq('email', t.email).single();
      users1[t.name] = newUser;
    } else {
      await supabase.from('users').update({ school_id: school1.id }).eq('id', existingUser.id);
      users1[t.name] = existingUser;
    }
  }

  // 2. Seed School 2 & its Teachers
  console.log(`Processing School 2: ${school2Name}`);
  let { data: school2 } = await supabase.from('schools').select('*').eq('name', school2Name).single();
  if (!school2) {
    const res = await supabase.from('schools').insert({ name: school2Name }).select().single();
    school2 = res.data;
  }

  const users2 = {};
  for (const t of teachers2Data) {
    let { data: existingUser } = await supabase.from('users').select('*').eq('email', t.email).single();
    if (!existingUser) {
      console.log(`Creating user: ${t.name}`);
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: t.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { name: t.name, role: 'teacher' }
      });
      if (authErr) {
        console.error("Error creating auth user:", authErr);
        continue;
      }
      await supabase.from('users').update({ school_id: school2.id }).eq('id', authUser.user.id);
      let { data: newUser } = await supabase.from('users').select('*').eq('email', t.email).single();
      users2[t.name] = newUser;
    } else {
      await supabase.from('users').update({ school_id: school2.id }).eq('id', existingUser.id);
      users2[t.name] = existingUser;
    }
  }

  // 3. Evaluations for Madina Abubakirkyzy (School 1)
  console.log("Generating evaluations for School 1...");
  const targetTeacher1 = users1['Дәулет Мадина Әбубакірқызы'];
  const evaluators1 = [
    users1['Муратова Индира Жарқынбекқызы'],
    users1['Сабденова Кулиза Кудайбергеновна'],
    users1['Бимуратова Гульмира Нурбергеновна']
  ];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const evaluator = evaluators1[i % evaluators1.length];
    const fb = getExtensiveFeedback(lesson.title, targetTeacher1.name, evaluator.name);

    const answersA = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 8: true }; // 7
    const answersB = { 1: 3, 2: 3, 3: 2, 4: 3, 5: 3, 6: 2 }; // 16
    const totalScore = 23;

    const answers = {
      appendix_a: answersA,
      appendix_b: answersB,
      qualitative_notes: {
        strengths: fb.strengths,
        improvement: fb.improvement
      },
      recommendations: [],
      _lesson_date: new Date().toISOString().split('T')[0],
      _lesson_time: '10:00',
      _lesson_number: lesson.num,
      _lesson_title: lesson.title
    };

    const { error: err } = await supabase.from('teacher_evaluations').insert({
      evaluator_id: evaluator.id,
      teacher_id: targetTeacher1.id,
      answers,
      score: totalScore
    });
    if (err) console.error("Error inserting evaluation school 1:", err);
  }

  // 4. Evaluations for Suleimenova Gulnar (School 2)
  console.log("Generating evaluations for School 2...");
  const targetTeacher2 = users2['Сүлеймнова Гүлнар Зинабытқызы'];
  const evaluators2 = [
    users2['Туралиева Гүлмира Мырзабаевна'],
    users2['Умбетова Жанат Кулпыбаевна'],
    users2['Мырзабаева Идаят Бектасовна']
  ];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const evaluator = evaluators2[i % evaluators2.length];
    const fb = getExtensiveFeedback(lesson.title, targetTeacher2.name, evaluator.name);

    const answersA = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true }; // 8
    const answersB = { 1: 3, 2: 3, 3: 3, 4: 2, 5: 3, 6: 3 }; // 17
    const totalScore = 25;

    const answers = {
      appendix_a: answersA,
      appendix_b: answersB,
      qualitative_notes: {
        strengths: fb.strengths,
        improvement: fb.improvement
      },
      recommendations: [],
      _lesson_date: new Date().toISOString().split('T')[0],
      _lesson_time: '11:00',
      _lesson_number: lesson.num,
      _lesson_title: lesson.title
    };

    const { error: err } = await supabase.from('teacher_evaluations').insert({
      evaluator_id: evaluator.id,
      teacher_id: targetTeacher2.id,
      answers,
      score: totalScore
    });
    if (err) console.error("Error inserting evaluation school 2:", err);
  }

  console.log("All reseeding and extensive feedback complete!");
}

reseed().catch(console.error);
