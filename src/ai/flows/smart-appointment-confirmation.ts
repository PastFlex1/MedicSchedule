// Implemented the Genkit flow for smart appointment confirmation using AI.
'use server';
/**
 * @fileOverview Smart Appointment Confirmation AI agent.
 *
 * - confirmAppointment - A function that handles the appointment confirmation process.
 * - ConfirmAppointmentInput - The input type for the confirmAppointment function.
 * - ConfirmAppointmentOutput - The return type for the confirmAppointment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfirmAppointmentInputSchema = z.object({
  patientName: z.string().describe('The name of the patient requesting the appointment.'),
  contactNumber: z.string().describe('The contact number of the patient.'),
  appointmentDate: z.string().describe('The requested date for the appointment (YYYY-MM-DD).'),
  appointmentTime: z.string().describe('The requested time for the appointment (HH:MM).'),
  doctorName: z.string().describe('The name of the doctor for the appointment.'),
  requirements: z.string().optional().describe('Any specific requirements for the appointment.'),
  availabilityCalendar: z.string().describe('A calendar of doctor availabilities.'),
});
export type ConfirmAppointmentInput = z.infer<typeof ConfirmAppointmentInputSchema>;

const ConfirmAppointmentOutputSchema = z.object({
  confirmationStatus: z.boolean().describe('Whether the appointment is confirmed or not.'),
  reason: z.string().describe('The reason for confirmation or rejection.'),
  suggestedAlternative: z.string().optional().describe('A suggested alternative time if the appointment is rejected.'),
});
export type ConfirmAppointmentOutput = z.infer<typeof ConfirmAppointmentOutputSchema>;

export async function confirmAppointment(input: ConfirmAppointmentInput): Promise<ConfirmAppointmentOutput> {
  return confirmAppointmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'confirmAppointmentPrompt',
  input: {schema: ConfirmAppointmentInputSchema},
  output: {schema: ConfirmAppointmentOutputSchema},
  prompt: `You are an AI assistant that confirms or rejects appointment requests based on doctor availability.

  Consider the following information when making your decision:

  Patient Name: {{{patientName}}}
  Contact Number: {{{contactNumber}}}
  Requested Date: {{{appointmentDate}}}
  Requested Time: {{{appointmentTime}}}
  Doctor Name: {{{doctorName}}}
  Requirements: {{{requirements}}}
  Availability Calendar: {{{availabilityCalendar}}}

  Determine if the appointment should be confirmed or rejected based on the provided information.  If rejected, provide a reason and suggest an alternative time.  The output should be JSON.  The "suggestedAlternative" field should be left blank if no alternative exists.

  Respond in the following JSON format:
  {
    "confirmationStatus": true or false,
    "reason": "Reason for confirmation or rejection",
    "suggestedAlternative": "Suggested alternative time (YYYY-MM-DD HH:MM)" or null
  }`,
});

const confirmAppointmentFlow = ai.defineFlow(
  {
    name: 'confirmAppointmentFlow',
    inputSchema: ConfirmAppointmentInputSchema,
    outputSchema: ConfirmAppointmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
