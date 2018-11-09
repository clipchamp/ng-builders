import { capture } from './exec.utils';

export async function getGitInfo(): Promise<any> {
  const commitId = await capture('git', ['rev-parse', 'HEAD']);
  const branchName = await capture('git', [
    'rev-parse',
    '--abbrev-ref',
    'HEAD'
  ]);
  return {
    id: commitId,
    branch: branchName,
    short: commitId.substring(0, 7)
  };
}
