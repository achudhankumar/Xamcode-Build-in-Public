import { runSeed, runSeedDemo } from '../src/lib/db/seed.ts';

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.log('Supabase is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
    console.log('Nothing was seeded. The app will run in demo mode.');
    const demo = await runSeedDemo();
    console.log(JSON.stringify(demo, null, 2));
    return;
  }

  const result = await runSeed({ url, serviceRoleKey });
  if (result.error) {
    console.error('Seed failed:', result.error);
    process.exitCode = 1;
    return;
  }
  console.log('Seed complete.');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Seed crashed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
