-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Schools
create table if not exists schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Users (extends Supabase auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('teacher', 'evaluator', 'admin')) default 'teacher',
  school_id uuid references schools(id),
  created_at timestamptz default now()
);

-- Classes
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  school_id uuid references schools(id),
  created_at timestamptz default now()
);

-- Students
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  class_id uuid references classes(id),
  created_at timestamptz default now()
);

-- Feedback (AI-generated)
create table if not exists feedback (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid not null,
  eval_type text not null check (eval_type in ('teacher', 'student')),
  summary text,
  strengths text,
  weaknesses text,
  suggestions text,
  created_at timestamptz default now()
);

-- Teacher Evaluations (Module 1: Yes/No checklist)
create table if not exists teacher_evaluations (
  id uuid primary key default uuid_generate_v4(),
  evaluator_id uuid references users(id),
  teacher_id uuid references users(id),
  answers jsonb not null default '{}',
  score integer not null default 0,
  feedback_id uuid references feedback(id),
  created_at timestamptz default now()
);

-- Student Evaluations (Module 2: Rubric 3-2-1)
create table if not exists student_evaluations (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references users(id),
  student_id uuid references students(id),
  scores jsonb not null default '{}',
  total integer not null default 0,
  feedback_id uuid references feedback(id),
  created_at timestamptz default now()
);

-- Row Level Security
alter table users enable row level security;
alter table schools enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table teacher_evaluations enable row level security;
alter table student_evaluations enable row level security;
alter table feedback enable row level security;

-- RLS Policies
drop policy if exists "Users can read own data" on users;
create policy "Users can read own data" on users for select using (auth.uid() = id);
drop policy if exists "Users can update own data" on users;
create policy "Users can update own data" on users for update using (auth.uid() = id);
drop policy if exists "Service role can manage all users" on users;
create policy "Service role can manage all users" on users for all using (auth.role() = 'service_role');

drop policy if exists "Authenticated can read schools" on schools;
create policy "Authenticated can read schools" on schools for select using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can read classes" on classes;
create policy "Authenticated can read classes" on classes for select using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can read students" on students;
create policy "Authenticated can read students" on students for select using (auth.role() = 'authenticated');

drop policy if exists "Teachers can read own evaluations" on teacher_evaluations;
create policy "Teachers can read own evaluations" on teacher_evaluations for select using (auth.uid() = evaluator_id or auth.uid() = teacher_id);
drop policy if exists "Evaluators can insert" on teacher_evaluations;
create policy "Evaluators can insert" on teacher_evaluations for insert with check (auth.uid() = evaluator_id);
drop policy if exists "Service role full access teacher_eval" on teacher_evaluations;
create policy "Service role full access teacher_eval" on teacher_evaluations for all using (auth.role() = 'service_role');

drop policy if exists "Teachers can read student evaluations" on student_evaluations;
create policy "Teachers can read student evaluations" on student_evaluations for select using (auth.uid() = teacher_id);
drop policy if exists "Teachers can insert student evaluations" on student_evaluations;
create policy "Teachers can insert student evaluations" on student_evaluations for insert with check (auth.uid() = teacher_id);
drop policy if exists "Service role full access student_eval" on student_evaluations;
create policy "Service role full access student_eval" on student_evaluations for all using (auth.role() = 'service_role');

drop policy if exists "Authenticated can read feedback" on feedback;
create policy "Authenticated can read feedback" on feedback for select using (auth.role() = 'authenticated');
drop policy if exists "Service role can manage feedback" on feedback;
create policy "Service role can manage feedback" on feedback for all using (auth.role() = 'service_role');

-- Triggers to auto-create user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'teacher')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sample data
insert into schools (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Мектеп №1'),
  ('22222222-2222-2222-2222-222222222222', 'Школа №25')
on conflict (id) do nothing;

insert into classes (id, name, school_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '9А', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10Б', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into students (name, class_id)
select seed.name, seed.class_id
from (
  values
    ('Арман Бейсенов', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('Камила Жакупова', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('Данияр Сейтқали', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('Айгерім Нұрланова', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
    ('Мұхаммед Серіков', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)
) as seed(name, class_id)
where not exists (
  select 1
  from students s
  where s.name = seed.name and s.class_id = seed.class_id
);
