/**
 * User-friendly error message utilities
 * 
 * Transforms technical error messages into clear, actionable messages
 * that help users understand what went wrong and what they can do about it.
 */

import type { AxiosError } from 'axios';

interface ErrorContext {
  operation?: string;
  resource?: string;
  additionalInfo?: string;
}

/**
 * Extracts user-friendly message from an error object
 */
export function getUserFriendlyError(
  error: unknown,
  context?: ErrorContext
): string {
  // Handle Axios errors (HTTP errors)
  if (isAxiosError(error)) {
    return getHttpErrorMessage(error, context);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return getErrorMessage(error.message, context);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return getErrorMessage(error, context);
  }

  // Default fallback
  return getDefaultErrorMessage(context);
}

/**
 * Checks if error is an Axios error
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    'request' in error
  );
}

/**
 * Gets user-friendly message for HTTP errors
 */
function getHttpErrorMessage(error: AxiosError, context?: ErrorContext): string {
  const status = error.response?.status;
  const data = error.response?.data as { detail?: string; message?: string } | undefined;

  // Try to get message from response body
  const serverMessage = data?.detail || data?.message;

  // Handle specific status codes with user-friendly messages
  switch (status) {
    case 400:
      return serverMessage 
        ? getErrorMessage(serverMessage, context)
        : context?.operation 
          ? `Unable to ${context.operation}. Please check your input and try again.`
          : 'Invalid request. Please check your input and try again.';

    case 401:
      return 'Your session has expired. Please sign in again to continue.';

    case 403:
      return 'You don\'t have permission to perform this action.';

    case 404:
      return context?.resource
        ? `${context.resource} could not be found. It may have been deleted or the link may be incorrect.`
        : 'The requested resource could not be found.';

    case 409:
      return serverMessage
        ? getErrorMessage(serverMessage, context)
        : context?.operation
          ? `Unable to ${context.operation}. This resource may already exist.`
          : 'This action conflicts with existing data. Please check and try again.';

    case 413:
      return 'The file is too large. Please upload a smaller file.';

    case 422:
      return serverMessage
        ? getErrorMessage(serverMessage, context)
        : 'The provided information is invalid. Please check and try again.';

    case 429:
      return 'Too many requests. Please wait a moment and try again.';

    case 402:
      return 'You need credits to use this feature. Please purchase credits to continue.';

    case 500:
    case 502:
    case 503:
    case 504:
      return serverMessage
        ? getErrorMessage(serverMessage, context)
        : 'Our servers are experiencing issues. Please try again in a few moments. If the problem persists, contact support.';

    default:
      // For other status codes, try to use server message or default
      if (serverMessage) {
        return getErrorMessage(serverMessage, context);
      }
      return getDefaultErrorMessage(context);
  }
}

/**
 * Transforms technical error messages into user-friendly ones
 */
function getErrorMessage(message: string, context?: ErrorContext): string {
  const lowerMessage = message.toLowerCase();

  // Authentication errors
  if (lowerMessage.includes('invalid credentials') || 
      lowerMessage.includes('incorrect password') ||
      lowerMessage.includes('authentication failed')) {
    return 'The username or password is incorrect. Please check your credentials and try again.';
  }

  if (lowerMessage.includes('user not found') || lowerMessage.includes('user does not exist')) {
    return 'No account found with this username. Please check your username or sign up for a new account.';
  }

  if (lowerMessage.includes('username already exists') || lowerMessage.includes('email already exists')) {
    return 'An account with this username or email already exists. Please sign in or use different credentials.';
  }

  // Network errors
  if (lowerMessage.includes('network error') || 
      lowerMessage.includes('networkerror') ||
      lowerMessage.includes('failed to fetch') ||
      lowerMessage.includes('network request failed')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'The request took too long to complete. Please try again.';
  }

  // File upload errors
  if (lowerMessage.includes('file too large') || lowerMessage.includes('size limit')) {
    return 'The file is too large. Please upload a file smaller than 10MB.';
  }

  if (lowerMessage.includes('invalid file type') || lowerMessage.includes('unsupported file')) {
    return 'This file type is not supported. Please upload a code file (e.g., .py, .js, .ts, .java, .cpp, .go, .rs).';
  }

  if (lowerMessage.includes('no files') || lowerMessage.includes('empty file')) {
    return 'Please select at least one file to upload.';
  }

  // GitHub errors
  if (lowerMessage.includes('github') && lowerMessage.includes('not found')) {
    return 'The GitHub repository could not be found. Please check the URL and make sure it\'s a public repository.';
  }

  if (lowerMessage.includes('github') && lowerMessage.includes('invalid')) {
    return 'Invalid GitHub repository URL. Please provide a valid GitHub repository link.';
  }

  if (lowerMessage.includes('github') && lowerMessage.includes('private')) {
    return 'Private repositories are not supported. Please use a public repository or upload files directly.';
  }

  if (lowerMessage.includes('github') && lowerMessage.includes('clone')) {
    return 'Unable to clone the repository. Please check the URL and try again.';
  }

  // Repository errors
  if (lowerMessage.includes('repository not found')) {
    return 'The repository could not be found. It may have been deleted.';
  }

  if (lowerMessage.includes('repository name') && lowerMessage.includes('already exists')) {
    return 'A repository with this name already exists. Please choose a different name.';
  }

  // API key errors
  if (lowerMessage.includes('api key') && lowerMessage.includes('invalid')) {
    return 'The API key is invalid. Please check your API key and try again.';
  }

  if (lowerMessage.includes('api key') && lowerMessage.includes('required')) {
    return 'An API key is required for this feature. Please add an API key in Settings.';
  }

  // Credit/billing errors
  if (lowerMessage.includes('credit') || lowerMessage.includes('insufficient')) {
    return 'You don\'t have enough credits for this action. Please purchase credits to continue.';
  }

  // Generic validation errors
  if (lowerMessage.includes('validation error') || lowerMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Default: return the message with context if available
  if (context?.operation && !lowerMessage.includes(context.operation.toLowerCase())) {
    return `Unable to ${context.operation}. ${message}`;
  }

  return message;
}

/**
 * Gets default error message based on context
 */
function getDefaultErrorMessage(context?: ErrorContext): string {
  if (context?.operation) {
    return `Unable to ${context.operation}. Please try again or contact support if the problem persists.`;
  }

  return 'Something went wrong. Please try again. If the problem persists, contact support.';
}

/**
 * Helper to create error context for common operations
 */
export const ErrorContexts = {
  login: { operation: 'sign in' },
  register: { operation: 'create your account' },
  upload: { operation: 'upload files', resource: 'Files' },
  github: { operation: 'clone repository', resource: 'Repository' },
  delete: { operation: 'delete', resource: 'Item' },
  save: { operation: 'save changes' },
  export: { operation: 'export documentation' },
  load: { operation: 'load', resource: 'Data' },
  chat: { operation: 'send message' },
};

