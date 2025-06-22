
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Upload, Image } from 'lucide-react';
import { 
  emergencyCleanupCorruptedStorage,
  resetCorruptedDatabaseRecords,
  type BeatMigrationResult
} from '@/lib/migrationUtils';
import { toast } from 'sonner';

export function ImageMigrationTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ cleaned: number; errors: string[] } | null>(null);
  const [resetResult, setResetResult] = useState<{ reset: number; errors: string[] } | null>(null);

  const runStorageCleanup = async () => {
    setIsRunning(true);
    setCleanupResult(null);
    
    try {
      toast.info('Starting cleanup of corrupted storage files...');
      const result = await emergencyCleanupCorruptedStorage();
      setCleanupResult(result);
      
      if (result.cleaned > 0) {
        toast.success(`Storage cleanup completed! Cleaned ${result.cleaned} corrupted files`);
      } else {
        toast.info('No corrupted storage files found');
      }
    } catch (error) {
      toast.error('Storage cleanup failed');
      console.error('Storage cleanup error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runDatabaseReset = async () => {
    setIsRunning(true);
    setResetResult(null);
    
    try {
      toast.info('Starting reset of corrupted database records...');
      const result = await resetCorruptedDatabaseRecords();
      setResetResult(result);
      
      if (result.reset > 0) {
        toast.success(`Database reset completed! Reset ${result.reset} corrupted records`);
      } else {
        toast.info('No corrupted database records found');
      }
    } catch (error) {
      toast.error('Database reset failed');
      console.error('Database reset error:', error);
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
            Storage & Database Cleanup Tool
          </CardTitle>
          <CardDescription>
            Clean up corrupted storage files and reset database records that point to invalid storage URLs. 
            Use this if you're experiencing issues with cover images not displaying properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={runStorageCleanup}
              disabled={isRunning}
              className="w-full"
              variant="outline"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Clean Storage Files
                </>
              )}
            </Button>

            <Button
              onClick={runDatabaseReset}
              disabled={isRunning}
              variant="destructive"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reset Database Records
                </>
              )}
            </Button>
          </div>

          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Storage Cleanup Results:</strong></p>
                  <p>Corrupted files cleaned: {cleanupResult.cleaned}</p>
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

          {resetResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Database Reset Results:</strong></p>
                  <p>Corrupted records reset: {resetResult.reset}</p>
                  {resetResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {resetResult.errors.map((error, index) => (
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
