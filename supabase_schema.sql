-- 가족 코드 및 식단 데이터를 위한 Supabase 테이블 스키마

-- 1. 가족 그룹 테이블
create table if not exists families (
  id uuid default gen_random_uuid() primary key,
  family_code varchar(10) unique not null,
  child_email varchar(255) not null,
  child_name varchar(255),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 식단 기록 테이블
create table if not exists meals (
  id uuid default gen_random_uuid() primary key,
  family_code varchar(10) references families(family_code) on delete cascade not null,
  image_url text,
  overall_risk varchar(20) not null,
  summary_title text not null,
  worst_risk_nutrient varchar(50) not null,
  foods jsonb not null default '[]'::jsonb,
  action_guides jsonb not null default '[]'::jsonb,
  friendly_message text not null,
  clinical_summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 인덱스
create index if not exists idx_families_code on families(family_code);
create index if not exists idx_meals_family_code on meals(family_code);

-- RLS (Row Level Security) 설정 (공개 읽기/쓰기 허용 - 가족 코드 기반)
alter table families enable row level security;
alter table meals enable row level security;

create policy "Allow all operations with anon key on families"
on families for all
using (true)
with check (true);

create policy "Allow all operations with anon key on meals"
on meals for all
using (true)
with check (true);
