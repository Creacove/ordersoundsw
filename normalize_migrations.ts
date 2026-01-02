
import fs from 'fs';
import path from 'path';

const migrationsDir = 'supabase/migrations';
const files = fs.readdirSync(migrationsDir);

files.forEach(file => {
    if (file.includes('-') && file.endsWith('.sql')) {
        const oldPath = path.join(migrationsDir, file);
        const newName = file.replace(/-/g, '_');
        const newPath = path.join(migrationsDir, newName);
        console.log(`Renaming ${file} to ${newName}`);
        fs.renameSync(oldPath, newPath);
    }
});
