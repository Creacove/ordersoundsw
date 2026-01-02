
import fs from 'fs';
import { execSync } from 'child_process';

const migrationsDir = 'supabase/migrations';
const localFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
const localTs = localFiles.map(f => f.substring(0, 14)).sort();

console.log(`Repairing ${localTs.length} migration versions...`);

// Supabase repair command works better one by one or in small batches
localTs.forEach(ts => {
    try {
        console.log(`Repairing version ${ts}...`);
        execSync(`npx supabase migration repair --status applied ${ts}`, { stdio: 'inherit' });
    } catch (e) {
        console.warn(`Could not repair ${ts} (might already be matched or missing): ${e.message}`);
    }
});
