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
  reason: z.string().describe('The reason for confirmation or rejection, in Spanish.'),
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
  prompt: `Eres un asistente de IA que confirma o rechaza solicitudes de citas basándose en la disponibilidad del doctor. Debes responder en español.

  Considera la siguiente información para tomar tu decisión:

  Nombre del Paciente: {{{patientName}}}
  Número de Contacto: {{{contactNumber}}}
  Fecha Solicitada: {{{appointmentDate}}}
  Hora Solicitada: {{{appointmentTime}}}
  Nombre del Doctor: {{{doctorName}}}
  Requisitos: {{{requirements}}}
  Calendario de Disponibilidad: {{{availabilityCalendar}}}

  Determina si la cita debe ser confirmada o rechazada basándote en la información proporcionada. Si la rechazas, proporciona una razón y sugiere una hora alternativa si es posible. La salida debe ser un JSON. El campo "suggestedAlternative" debe dejarse en blanco si no existe una alternativa.

  Responde en el siguiente formato JSON:
  {
    "confirmationStatus": true o false,
    "reason": "Razón en español para la confirmación o rechazo",
    "suggestedAlternative": "Hora alternativa sugerida (YYYY-MM-DD HH:MM)" o null
  }`,
});

const confirmAppointmentFlow = ai.defineFlow(
  {
    name: 'confirmAppointmentFlow',
    inputSchema: ConfirmAppointmentInputSchema,
    outputSchema: ConfirmAppointmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {model: 'googleai/gemini-1.5-flash-latest'});
    return output!;
  }
);
