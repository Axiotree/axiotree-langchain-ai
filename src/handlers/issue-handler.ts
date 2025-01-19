import { AIService } from '../services/ai-service';
import { GitHubService } from '../services/github-service';
import { generatePRDescription } from '../utils/templates';
import { Issue } from '../types';

export class IssueHandler {
  constructor(
    private githubService: GitHubService,
    private aiService: AIService
  ) {}

  /**
   * Handles an issue by analyzing it, generating code changes, creating a new branch,
   * committing the changes, and creating a pull request.
   *
   * @param issue - The issue to handle.
   * @returns A promise that resolves when the issue handling is complete.
   */
  async handleIssue(issue: Issue): Promise<void> {
    const analysis = await this.aiService.analyzeIssue(issue.body);
    const changes = await this.aiService.generateCodeChanges(analysis);
    
    const branchName = `ai-pr/${issue.number}`;
    await this.githubService.createBranch(branchName);
    
    for (const change of changes) {
      await this.githubService.commitChange({
        branch: branchName,
        path: change.path,
        content: change.content,
        message: change.message,
      });
    }

    const prDescription = generatePRDescription({
      issueNumber: issue.number,
      changes,
      analysis,
    });

    await this.githubService.createPR({
      title: `AI: ${issue.title}`,
      body: prDescription,
      branch: branchName,
      labels: ['axiotree-langchain-ai-pr'],
    });
  }
}
