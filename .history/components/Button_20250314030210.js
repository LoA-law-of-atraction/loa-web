'use client';

import { useState } from 'react';
import LeadForm from "./LeadForm";

const Button = ({ text }) => {
  const [showForm, setShowForm] = useState(false);

  const handleForm = () => {
    if (text === 'Learn More') {
      window.location.href = '/about';
      return;
    }
    setShowForm(true);
  }

  const handleloseForm = () => {
    setShowForm(false);
  }

  return (
    <>
      <button
        className="text-white active:scale-95 transition-all relative group cursor-pointer font-bold rounded-lg p-0.5 shadow-lg bg-gradient-to-tr from-white to-[#505050] focus:outline-none focus:shadow-outline"
        onClick={() => handleForm()}
      >
        <div
          className="absolute -inset-1 bg-gradient-to-r from-white to-[#505050] rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"
        />
        <div className="bg-bg relative text-[3vw] md:text-body p-3 rounded-lg">
          {text}
        </div>
      </button>
      {showForm && <LeadForm handleClose={handleloseForm} />}
    </>
  );
};

export default Button;
