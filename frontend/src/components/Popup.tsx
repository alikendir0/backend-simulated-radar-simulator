import React from "react";

const Popup: React.FC<{ data: { image: string, name: string, type: string, class: string, altitude?: number, speed?: number, distance?: number}, onClose: () => void }> = ({ data, onClose }) => (
    <div style={{
        position: "absolute",
        color: "#00ff00",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: "10px 20px",
        borderRadius: "4px",
        fontFamily: "monospace",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "black",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "20px",
        minWidth: "300px"
    }}>
        <div>
            <h3>Aircraft Information</h3>
            <p>Name: {data.name}</p>
            <p>Type: {data.type}</p>
            <p>Class: {data.class}</p>
            {data.altitude !== undefined && <p>Altitude: {data.altitude.toFixed(1)}m</p>}
            {data.speed !== undefined && <p>Speed: {data.speed.toFixed(1)} deg/s</p>}
            {data.distance !== undefined && <p>Distance: {data.distance.toFixed(1)}m</p>}
            <button
                onClick={onClose}
                style={{
                    marginTop: "10px",
                    backgroundColor: "#222",
                    color: "lime",
                    padding: "4px 8px",
                    border: "1px solid lime",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontFamily: "monospace"
                }}>
                Close
            </button>
        </div>
        <img
            src={data.image}
            alt={data.name}
            style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
                border: "1px solid lime",
                padding: "4px"
            }}
        />
    </div>
);

export default Popup;
