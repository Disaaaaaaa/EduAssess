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

const schoolName = 'Алматы қаласы Жетісу ауданы №2 мектеп';

const teachersData = [
  { name: 'Сүлеймнова Гүлнар Зинабытқызы', email: 'suleimenova@example.com' },
  { name: 'Туралиева Гүлмира Мырзабаевна', email: 'turalieva@example.com' },
  { name: 'Умбетова Жанат Кулпыбаевна', email: 'umbetova@example.com' },
  { name: 'Мырзабаева Идаят Бектасовна', email: 'myrzabaeva@example.com' }
];

const lessons = [
  { num: 1, title: 'Жалпы білім беру мақсаттары мен міндеттері' },
  { num: 2, title: 'Оқушылардың сыни ойлауын дамыту' },
  { num: 3, title: 'Заманауи сабақтағы инновациялық әдістер' }
];

async function seed() {
  // 1. Ensure school exists
  let { data: school, error: schoolErr } = await supabase
    .from('schools')
    .select('*')
    .eq('name', schoolName)
    .single();

  if (!school) {
    console.log("Creating school...");
    const res = await supabase.from('schools').insert({ name: schoolName }).select().single();
    school = res.data;
  }
  
  // 2. Create users
  const createdUsers = {};
  for (const t of teachersData) {
    let { data: existingUser } = await supabase.from('users').select('*').eq('email', t.email).single();
    
    if (!existingUser) {
      console.log(`Creating user: ${t.name}`);
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: t.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          name: t.name,
          role: 'teacher'
        }
      });
      if (authErr) {
        console.error("Error creating auth user:", authErr);
        continue;
      }
      
      // Update the user to attach the school
      await supabase.from('users').update({ school_id: school.id }).eq('id', authUser.user.id);
      
      let { data: newUser } = await supabase.from('users').select('*').eq('email', t.email).single();
      createdUsers[t.name] = newUser;
    } else {
      console.log(`User already exists: ${t.name}`);
      await supabase.from('users').update({ school_id: school.id }).eq('id', existingUser.id);
      createdUsers[t.name] = existingUser;
    }
  }

  // 3. Create evaluations for one of the teachers
  const targetTeacherName = 'Сүлеймнова Гүлнар Зинабытқызы';
  const targetTeacher = createdUsers[targetTeacherName];
  
  const evaluators = [
    createdUsers['Туралиева Гүлмира Мырзабаевна'],
    createdUsers['Умбетова Жанат Кулпыбаевна'],
    createdUsers['Мырзабаева Идаят Бектасовна']
  ];

  if (!targetTeacher) {
    console.error("Target teacher not found!");
    return;
  }

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const evaluator = evaluators[i % evaluators.length];

    // Dummy answers
    const answersA = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true }; // 8/8
    const answersB = { 1: 3, 2: 3, 3: 3, 4: 2, 5: 3, 6: 3 }; // 17/18
    const totalScore = 8 + 17; // 25

    const answers = {
      appendix_a: answersA,
      appendix_b: answersB,
      qualitative_notes: {
        strengths: `Жоғары деңгейдегі сабақ. Тақырып: ${lesson.title}`,
        improvement: 'Оқушыларды көбірек тартуға болады.'
      },
      recommendations: [],
      _lesson_date: new Date().toISOString().split('T')[0],
      _lesson_time: '11:00',
      _lesson_number: lesson.num,
      _lesson_title: lesson.title
    };

    console.log(`Creating evaluation for lesson ${lesson.num} by ${evaluator.name}`);
    const { error: evalErr } = await supabase.from('teacher_evaluations').insert({
      evaluator_id: evaluator.id,
      teacher_id: targetTeacher.id,
      answers,
      score: totalScore
    });

    if (evalErr) {
      console.error("Error creating evaluation:", evalErr);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
