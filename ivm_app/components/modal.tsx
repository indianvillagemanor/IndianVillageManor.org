import React from 'react'
import Image from 'next/image'

// const closeModal = () => {
//   const modal = document.getElementById("modal");
//   if (modal) {
//     modal.classList.add("hidden");
//     modal.classList.remove('flex');
//   }
// }

// export const showModal = (src: string) => {
//   const modal = document.getElementById("modal");
//   if (modal) {
//     modal.classList.remove('hidden');
//     modal.classList.add('flex');
//   } else {
//     console.error("modal not found");
//   }
//   const modalImg = document.getElementById("modal-img") as HTMLImageElement;
//   if (modalImg) {
//     modalImg.src = src;
//   } else {
//     console.error("modal-img not found");
//   }
// }

interface ModalProps {
  src?: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ src, onClose }) => {

  const modalVisibility = src ? "flex" : "hidden";

  return (
    <div id="modal"
      className={modalVisibility + " fixed top-0 left-0 w-screen h-screen bg-black/90 justify-center items-center"}
      style={{ zIndex: 80, position: "fixed" }}>

      <a className="fixed top-6 right-8 text-white text-5xl font-bold"
        onClick={onClose} style={{ zIndex: 90 }}>
        &times;
      </a>
      <Image
        src={src || "/favicon.ico"}
        fill={true}
        alt={src || "zoomed-in image"}
        object-fit="contain"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div >)
}

export default Modal