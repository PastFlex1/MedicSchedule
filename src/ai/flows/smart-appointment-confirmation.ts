'use server';
/**
 * @fileOverview Smart Appointment Confirmation AI agent.
 *
 * - confirmAppointment - A function that handles the appointment confirmation process.
 * - ConfirmAppointmentInput - The input type for the confirmAppointment function.
 * - ConfirmAppointmentOutput - The return type for the confirmAppointment function.
 */

import {z} from 'zod';
import type { ConfirmAppointmentInput, ConfirmAppointmentOutput } from '@/lib/types';


// Note: This file is not currently used but is kept for potential future AI integration.

export async function confirmAppointment(input: ConfirmAppointmentInput): Promise<ConfirmAppointmentOutput> {
  // This is a placeholder for local confirmation logic.
  // The AI flow has been disabled as per user request.
  return Promise.resolve({
    confirmationStatus: true,
    reason: "Su cita ha sido confirmada. Le enviaremos un recordatorio.",
  });
}
