import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Upload, Image, Wrench } from 'lucide-react';
import { 
  migrateBase64ImagesToStorage, 
  cleanupCorruptedRecords, 
  migrateBeatCoverImagesToStorage,
  repairCorruptedStorageImages,
  type MigrationResult,
  type BeatMigrationResult,
  type StorageRepairResult 
} from '@/lib/migrationUtils';
import { toast } from 'sonner';

export function ImageMigrationTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [beatMigrationResult, setBeatMigrationResult] = useState<BeatMigrationResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{ cleaned: number; errors: string[] } | null>(null);
  const [repairResult, setRepairResult] = useState<StorageRepairResult | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setMigrationResult(null);
    
    try {
      toast.info('Starting migration of base64 images to storage...');
      const result = await migrateBase64ImagesToStorage();
      setMigrationResult(result);
      
      if (result.migratedUsers > 0) {
        toast.success(`Migration completed! Migrated ${result.migratedUsers} users`);
      } else {
        toast.info('No users found with base64 profile pictures');
      }
    } catch (error) {
      toast.error('Migration failed');
      console.error('Migration error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runBeatMigration = async () => {
    setIsRunning(true);
    setBeatMigrationResult(null);
    
    try {
      toast.info('Starting migration of beat base64 cover images to storage...');
      const result = await migrateBeatCoverImagesToStorage();
      setBeatMigrationResult(result);
      
      if (result.migratedBeats > 0) {
        toast.success(`Beat migration completed! Migrated ${result.migratedBeats} beats`);
      } else {
        toast.info('No beats found with base64 cover images');
      }
    } catch (error) {
      toast.error('Beat migration failed');
      console.error('Beat migration error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runCleanup = async () => {
    setIsRunning(true);
    setCleanupResult(null);
    
    try {
      toast.info('Starting cleanup of corrupted records...');
      const result = await cleanupCorruptedRecords();
      setCleanupResult(result);
      
      if (result.cleaned > 0) {
        toast.success(`Cleanup completed! Cleaned ${result.cleaned} corrupted records`);
      } else {
        toast.info('No corrupted records found');
      }
    } catch (error) {
      toast.error('Cleanup failed');
      console.error('Cleanup error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runStorageRepair = async () => {
    setIsRunning(true);
    setRepairResult(null);
    
    try {
      toast.info('Starting repair of corrupted storage images...');
      const result = await repairCorruptedStorageImages();
      setRepairResult(result);
      
      if (result.repairedFiles > 0) {
        toast.success(`Storage repair completed! Repaired ${result.repairedFiles} images`);
      } else {
        toast.info('No corrupted images found to repair');
      }
    } catch (error) {
      toast.error('Storage repair failed');
      console.error('Storage repair error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Image Storage Migration Tool
          </CardTitle>
          <CardDescription>
            Migrate profile pictures and beat cover images from base64 storage to Supabase Storage to fix database corruption and improve performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={runMigration}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate User Images
                </>
              )}
            </Button>

            <Button
              onClick={runBeatMigration}
              disabled={isRunning}
              className="w-full"
              variant="secondary"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Migrate Beat Covers
                </>
              )}
            </Button>

            <Button
              onClick={runStorageRepair}
              disabled={isRunning}
              className="w-full"
              variant="outline"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Repair Storage Images
                </>
              )}
            </Button>

            <Button
              onClick={runCleanup}
              disabled={isRunning}
              variant="destructive"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Clean Corrupted Records
                </>
              )}
            </Button>
          </div>

          {migrationResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>User Profile Migration Results:</strong></p>
                  <p>Total users found: {migrationResult.totalUsers}</p>
                  <p>Successfully migrated: {migrationResult.migratedUsers}</p>
                  <p>Failed migrations: {migrationResult.failedUsers}</p>
                  {migrationResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {migrationResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {beatMigrationResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Beat Cover Image Migration Results:</strong></p>
                  <p>Total beats found: {beatMigrationResult.totalBeats}</p>
                  <p>Successfully migrated: {beatMigrationResult.migratedBeats}</p>
                  <p>Failed migrations: {beatMigrationResult.failedBeats}</p>
                  {beatMigrationResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {beatMigrationResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Cleanup Results:</strong></p>
                  <p>Corrupted records cleaned: {cleanupResult.cleaned}</p>
                  {cleanupResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {cleanupResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {repairResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Storage Repair Results:</strong></p>
                  <p>Total files found: {repairResult.totalFiles}</p>
                  <p>Successfully repaired: {repairResult.repairedFiles}</p>
                  <p>Failed repairs: {repairResult.failedFiles}</p>
                  {repairResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {repairResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
