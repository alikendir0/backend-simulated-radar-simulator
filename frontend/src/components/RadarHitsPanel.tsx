import React from "react";

interface HitData {
    id: string;
    name: string;
    distance: number;
    speed: number;
    time: number;
    hitPoint: { x: number; y: number; z: number };
}

interface RadarHitsPanelProps {
    radarHits: Record<string, HitData>;
    onInspect: (id: string) => void;
}


const RadarHitsPanel: React.FC<RadarHitsPanelProps> = ({ radarHits, onInspect }) => (
    <div 
        style={{
            position: "absolute",
            top: 60,
            left: 20,
            color: "#00ff00",
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: "10px",
            borderRadius: "4px",
            fontFamily: "monospace",
            zIndex: 10,
            maxHeight: "calc(100vh - 80px)", // Max height to prevent expanding beyond screen
            width: "300px", // Fixed width to prevent horizontal expansion
            border: "1px solid #00ff00"
        }}
        onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
        }}
    >
        <div style={{ 
            marginBottom: "5px", 
            fontWeight: "bold",
            borderBottom: "1px solid #00ff44",
            paddingBottom: "5px"
        }}>
            Radar Hits ({Object.keys(radarHits).length}):
        </div>
        <div style={{
            maxHeight: "calc(100vh - 140px)", // Scrollable area
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "5px"
        }}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {
                Object.keys(radarHits).length > 0 ? (
                    Object.keys(radarHits).map((key) => {
                        const hit = radarHits[key];
                        const timeStr = new Date(hit.time).toLocaleTimeString();
                        
                        // Determine aircraft type and colors
                        let borderColor = "rgba(0,255,68,0.6)"; // Default green
                        let backgroundColor = "rgba(0,255,68,0.1)";
                        let textColor = "#88ff88";
                        let buttonColor = "#00ff00";
                        
                        if (hit.name.includes("Military") || hit.name.includes("F-16") || hit.name.includes("Bayraktar")) {
                            // Military - Red
                            borderColor = "rgba(255,68,68,0.6)";
                            backgroundColor = "rgba(255,68,68,0.1)";
                            textColor = "#ff8888";
                            buttonColor = "#ff4444";
                        } else if (hit.name.includes("Police") || hit.name.includes("Bell")) {
                            // Police - Blue
                            borderColor = "rgba(68,150,255,0.6)";
                            backgroundColor = "rgba(68,150,255,0.1)";
                            textColor = "#88bbff";
                            buttonColor = "#4496ff";
                        }
                        // Civilian remains green (default)
                        
                        return (
                            <li key={key} style={{ 
                                marginBottom: "8px", 
                                padding: "8px",
                                backgroundColor: backgroundColor,
                                borderRadius: "3px",
                                border: `1px solid ${borderColor}`
                            }}>
                                <div style={{ fontSize: "0.85rem", lineHeight: "1.3" }}>
                                    • <strong>{hit.name}</strong>
                                </div>
                                <div style={{ fontSize: "0.75rem", color: textColor, marginTop: "2px" }}>
                                    Dist: {hit.distance.toFixed(1)}u | Alt: {hit.hitPoint.y.toFixed(1)}u | Spd: {hit.speed}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: textColor, marginTop: "1px", opacity: 0.8 }}>
                                    {timeStr}
                                </div>
                                <button
                                    style={{
                                        marginTop: "5px",
                                        padding: "3px 6px",
                                        fontSize: "0.7rem",
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        color: buttonColor,
                                        border: `1px solid ${buttonColor}`,
                                        borderRadius: "2px",
                                        cursor: "pointer",
                                        fontFamily: "monospace"
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onInspect(hit.id);
                                    }}
                                >
                                    Inspect
                                </button>
                            </li>
                        );
                    })
                ) : (
                    <li style={{ 
                        textAlign: "center", 
                        color: "#666", 
                        fontStyle: "italic",
                        padding: "20px"
                    }}>
                        • No radar contacts
                    </li>
                )}
            </ul>
        </div>
    </div>
);

export default RadarHitsPanel;
