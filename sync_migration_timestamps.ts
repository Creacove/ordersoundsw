
import fs from 'fs';
import path from 'path';

const remoteVersions = [
    '20250616044448', '20250616080658', '20250616081349', '20250616082830', '20250616101946',
    '20250619105529', '20250619111517', '20250619112447', '20250624083636', '20250624084835',
    '20250624085321', '20250628062710', '20250628064042', '20250701013052', '20250712033515',
    '20251001115457', '20251001115638', '20251001115730', '20251001115843', '20251008010557',
    '20251008013027', '20251008015157', '20251008023005', '20251008024245', '20251008031827',
    '20251008033338', '20251008040337', '20251008044827', '20251008095644', '20251008100734',
    '20251008101223', '20251008103016', '20251015174310', '20251016051044', '20251016054330',
    '20251016054927', '20251016055014', '20251021100742', '20251112120602', '20251112154124',
    '20251114080550', '20251114081611'
];

const migrationsDir = 'supabase/migrations';
const localFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

localFiles.forEach(file => {
    const localTs = file.substring(0, 14);

    // Find a remote version that is "close" (same day or within 13 hours)
    const matchedRemote = remoteVersions.find(rv => {
        // Exact match
        if (rv === localTs) return true;

        // Day match (YYYYMMDD)
        if (rv.substring(0, 8) === localTs.substring(0, 8)) {
            // Here we could add more logic, but day match is usually enough in a small project
            return true;
        }
        return false;
    });

    if (matchedRemote && matchedRemote !== localTs) {
        const oldPath = path.join(migrationsDir, file);
        const newName = matchedRemote + file.substring(14);
        const newPath = path.join(migrationsDir, newName);
        console.log(`Matching ${file} to remote version ${matchedRemote}`);
        fs.renameSync(oldPath, newPath);
    }
});
