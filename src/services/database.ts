
/**
 * @fileoverview This service acts as the database abstraction layer.
 *
 * All interactions with the underlying database (e.g., Firestore)
 * should be routed through the functions defined in this file. This allows
 * for a seamless transition between different database providers without
 * needing to refactor the entire application.
 */

// Server-only data layer. Deliberately NOT a 'use server' module: that
// directive would compile every export into a PUBLIC Server Action endpoint
// callable with an attacker-chosen userId. Call these only from authenticated
// API routes (which derive uid from the verified token), never from client code.
import 'server-only';

import { adminDb } from '@/lib/firebaseAdmin';
import { fail } from '@/lib/api-helpers';
import type { Project, BrandKit, KnowledgeFile, OnboardingDraft } from '@/types';


/**
 * Fetches a single project document from the projects_catalog collection.
 * @param projectId The ID of the project to fetch.
 * @returns The project data object or null if not found.
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  if (!adminDb) {
    console.error("Database service is unavailable because Firestore Admin is not initialized.");
    throw new Error("Database service is unavailable.");
  }
  try {
    // First, try to get from the main catalog
    const projectDocRef = adminDb.collection('projects_catalog').doc(projectId);
    const projectDoc = await projectDocRef.get();

    if (projectDoc.exists) {
        return { id: projectDoc.id, ...projectDoc.data() } as Project;
    } else {
        // If not in catalog, it might be a user's custom project.
        // This is a simplified lookup. A real app might need a more complex query.
        console.warn(`Project with ID "${projectId}" not found in projects_catalog. Searching user libraries is not implemented in this mock.`);
        return null;
    }
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw fail(error);
  }
}

interface UserProfileData {
    companyName?: string;
    brandKit?: BrandKit;
    onboarding?: Partial<OnboardingDraft>;
}

/**
 * Saves or updates a user's profile data in the 'users' collection.
 * This function also marks onboarding as complete.
 * @param userId The UID of the user.
 * @param data The data to save. This will be merged with existing data.
 * @returns A promise that resolves when the data is saved.
 */
export async function saveUserData(userId: string, data: UserProfileData): Promise<void> {
    if (!adminDb) {
        console.error("Database service is unavailable because Firestore Admin is not initialized.");
        throw new Error("Database service is unavailable.");
    }
    try {
        const userDocRef = adminDb.collection('users').doc(userId);
        
        // Add onboarding completion flag to the data being saved.
        const finalData = {
            ...data,
            onboarding: {
                ...data.onboarding,
                isComplete: true,
            }
        };

        await userDocRef.set(finalData, { merge: true });
    } catch (error) {
        console.error(`Error saving data for user ${userId}:`, error);
        throw fail(error);
    }
}


/**
 * Adds a file to a user's knowledge base.
 * @param userId The UID of the user.
 * @param fileData The file data to add.
 * @returns The ID of the newly created document.
 */
export async function addFileToKnowledgeBase(userId: string, fileData: Omit<KnowledgeFile, 'id'>): Promise<string> {
    if (!adminDb) throw new Error("Database service is unavailable.");
    try {
        const docRef = await adminDb.collection('users').doc(userId).collection('knowledgeBase').add({
            ...fileData,
            createdAt: new Date(),
        });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding file to knowledge base for user ${userId}:`, error);
        throw fail(error);
    }
}

/**
 * Retrieves all files from a user's knowledge base.
 * @param userId The UID of the user.
 * @returns An array of knowledge files.
 */
export async function getKnowledgeBaseFiles(userId: string): Promise<KnowledgeFile[]> {
    if (!adminDb) throw new Error("Database service is unavailable.");
    try {
        const snapshot = await adminDb.collection('users').doc(userId).collection('knowledgeBase').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeFile));
    } catch (error) {
        console.error(`Error getting knowledge base files for user ${userId}:`, error);
        throw fail(error);
    }
}

/**
 * Deletes a file from a user's knowledge base.
 * @param userId The UID of the user.
 * @param fileId The ID of the file to delete.
 */
export async function deleteFileFromKnowledgeBase(userId: string, fileId: string): Promise<void> {
    if (!adminDb) throw new Error("Database service is unavailable.");
    try {
        await adminDb.collection('users').doc(userId).collection('knowledgeBase').doc(fileId).delete();
    } catch (error) {
        console.error(`Error deleting file ${fileId} for user ${userId}:`, error);
        throw fail(error);
    }
}
