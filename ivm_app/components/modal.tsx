import React from 'react'

const closeModal = () => {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove('flex');
  }
}

export const showModal = (src: string) => {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    console.error("modal not found");
  }
  const modalImg = document.getElementById("modal-img") as HTMLImageElement;
  if (modalImg) {
    modalImg.src = src;
  } else {
    console.error("modal-img not found");
  }
}

const Modal = () => {
  return (
    <div id="modal"
      className="hidden fixed top-0 left-0 w-screen h-screen bg-black/90 justify-center items-center"
      style={{ zIndex: 80 }}>

      <a className="fixed z-90 top-6 right-8 text-white text-5xl font-bold"
        onClick={closeModal}>
        &times;
      </a>

      <img id="modal-img" className="max-w-full max-h-full w-full h-full object-contain" />
    </div >)
}

export default Modal