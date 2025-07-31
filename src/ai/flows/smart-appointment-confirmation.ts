'use server';
/**
 * @fileOverview Smart Appointment Confirmation AI agent.
 *
 * - confirmAppointment - A function that handles the appointment confirmation process.
 * - ConfirmAppointmentInput - The input type for the confirmAppointment function.
 * - ConfirmAppointmentOutput - The return type for the confirmAppointment function.
 */

import {z} from 'genkit/zod';

// Note: This file is not currently used but is kept for potential future AI integration.

export const ConfirmAppointmentInputSchema = z.object({
  patientName: z.string().describe('The name of the patient requesting the appointment.'),
  contactNumber: z.string().describe('The contact number of the patient.'),
  appointmentDate: z.string().describe('The requested date for the appointment (YYYY-MM-DD).'),
  appointmentTime: z.string().describe('The requested time for the appointment (HH:MM).'),
  doctorName: z.string().describe('The name of the doctor for the appointment.'),
  requirements: z.string().optional().describe('Any specific requirements for the appointment.'),
});
export type ConfirmAppointmentInput = z.infer<typeof ConfirmAppointmentInputSchema>;

export const ConfirmAppointmentOutputSchema = z.object({
  confirmationStatus: z.boolean().describe('Whether the appointment is confirmed or not.'),
  reason: z.string().describe('The reason for confirmation or rejection, in Spanish.'),
  suggestedAlternative: z.string().optional().describe('A suggested alternative time if the appointment is rejected.'),
});
export type ConfirmAppointmentOutput = z.infer<typeof ConfirmAppointmentOutputSchema>;

export async function confirmAppointment(input: ConfirmAppointmentInput): Promise<ConfirmAppointmentOutput> {
  // This is a placeholder for local confirmation logic.
  // The AI flow has been disabled as per user request.
  return Promise.resolve({
    confirmationStatus: true,
    reason: "Su cita ha sido confirmada. Le enviaremos un recordatorio.",
  });
}
