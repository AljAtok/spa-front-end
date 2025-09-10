// src/api/systemApi.ts
import api from "./axiosConfig";
import { System } from "../types/SystemTypes"; // Import the System interface

const SYSTEM_API_BASE_URL = "/roles";

export const fetchAllSystems = async (): Promise<System[]> => {
  try {
    const response = await api.get<System[]>(SYSTEM_API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching all systems:", error);
    throw error; // Re-throw to be caught by the component
  }
};

export const fetchSystemById = async (id: string | number): Promise<System> => {
  try {
    const response = await api.get<System>(`${SYSTEM_API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching system with ID ${id}:`, error);
    throw error;
  }
};

export const createSystem = async (
  systemData: Omit<System, "id">
): Promise<System> => {
  try {
    const response = await api.post<System>(SYSTEM_API_BASE_URL, systemData);
    return response.data;
  } catch (error) {
    console.error("Error creating system:", error);
    throw error;
  }
};

export const updateSystem = async (
  id: string | number,
  systemData: Partial<System>
): Promise<System> => {
  try {
    const response = await api.put<System>(
      `${SYSTEM_API_BASE_URL}/${id}`,
      systemData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating system with ID ${id}:`, error);
    throw error;
  }
};

export const deleteSystem = async (id: string | number): Promise<void> => {
  try {
    await api.delete(`${SYSTEM_API_BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting system with ID ${id}:`, error);
    throw error;
  }
};
