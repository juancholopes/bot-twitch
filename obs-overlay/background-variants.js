// Estilos de fondo personalizables para el overlay
// Agrega esto al final de CompactTaskList.jsx o crea un archivo separado

export const BackgroundVariants = {
  // Blur clásico (blanco semi-transparente)
  classic: `
    background: rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255, 255, 255, 0.3);
  `,

  // Blur oscuro
  dark: `
    background: rgba(0, 0, 0, 0.4) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `,

  // Blur azul gaming
  gaming: `
    background: rgba(30, 144, 255, 0.2) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(30, 144, 255, 0.4);
  `,

  // Blur púrpura
  purple: `
    background: rgba(138, 43, 226, 0.2) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(138, 43, 226, 0.4);
  `,

  // Blur verde
  green: `
    background: rgba(34, 197, 94, 0.2) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(34, 197, 94, 0.4);
  `,

  // Sin blur (solo semi-transparente)
  minimal: `
    background: rgba(0, 0, 0, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `,
};

// Para usar una variante, cambia el BlurredBackground así:
// const BlurredBackground = styled.div`
//   position: absolute;
//   top: 0px;
//   left: 0px;
//   right: 0px;
//   bottom: 0px;
//   ${BackgroundVariants.gaming} // Cambia 'gaming' por el que prefieras
//   -webkit-backdrop-filter: blur(16px) !important;
//   border-radius: 12px;
//   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
//   pointer-events: none;
//   z-index: 1;
// `;
