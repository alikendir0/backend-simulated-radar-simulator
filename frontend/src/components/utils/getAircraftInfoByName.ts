import { fetchAircraftByName } from "./api";

export interface AircraftInfo {
    image: string;
    name: string;
    type: string;
    class: string;
}

export const getAircraftInfoByName = async (name: string): Promise<AircraftInfo> => {
    try {
        const data = await fetchAircraftByName(name);
        return {
            image: data.image,
            name: data.name,
            type: data.type,
            class: data.class
        };
    } catch (error) {
        console.error("Error fetching aircraft info:", error);
        return {
            image: "",
            name: "",
            type: "",
            class: "",
        };
    }
};

