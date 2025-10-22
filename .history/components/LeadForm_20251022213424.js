'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCancel } from 'react-icons/md';
import { useFormik } from 'formik';
import { InfinitySpin } from 'react-loader-spinner';
import * as Yup from 'yup';
import Success from '@/components/Success';
import { db } from '@/utils/firebase';
import { addDoc, collection } from 'firebase/firestore';

const errorVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

function LeadForm({ handleClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Kindly enter a valid email address'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const leadsCollectionRef = collection(db, "waitlist");
        
        await addDoc(leadsCollectionRef, {
          email: values.email,
          timestamp: new Date(),
        });

        setSuccess(true);
        setIsLoading(false);

        formik.resetForm();
      } catch (err) {
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
    validateOnChange: false,
    validateOnBlur: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      formik.setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [formik, formik.errors]);

  if (isLoading) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => handleClose()}
        className="min-h-screen flex w-full z-[100] items-center justify-center fixed top-0 left-0 bg-opacity-85 bg-primary"
      >
        <InfinitySpin visible width="200" color="#505050" ariaLabel="infinity-spin-loading" />
      </motion.section>
    )
}

  return (
    <motion.div
      className="bg-[#505050] fixed top-0 left-0 w-[100%] flex flex-col items-center justify-center z-[1000] bg-opacity-70 h-[100%] shadow-md p-6 text-primary"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => handleClose()}
    >
      <MdCancel className="absolute left-5 top-10 lg:top-14 lg:left-14 text-2xl cursor-pointer text-white" onClick={() => handleClose()} />

      <form onSubmit={
        formik.handleSubmit
        } onClick={(e) => e.stopPropagation()} className="relative flex flex-col items-center py-14 gap-4 bg-primary text-white w-[90%] max-w-[500px] p-6 rounded-lg">
        <h2 className="text-xl font-semibold">Join Our Waitlist</h2>
        <p className="text-sm text-center md:max-w-[85%] lg:max-w-[60%] text-silver mb-2">Enter your valid email to get a special discount when we go live!</p>
        <input
          type="email"
          name="email"
          className="w-full max-w-[300px] p-3 border rounded-md focus:outline-none focus:ring focus:border-white bg-gray-700 text-white"
          placeholder='youremail@example.com'
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <AnimatePresence>
          {formik.touched.email && formik.errors.email ? (
            <motion.div
              key="email-error"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute text-sm left-5 top-[63%] text-silver"
            >
              <span className='text-red-500'>* </span>{formik.errors.email}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          type="submit"
          className={`bg-[#505050] text-white font-bold p-3 mt-6 rounded-md hover:bg-silver hover:text-black focus:outline-none active:scale-95 transition-all ${
            isLoading ? 'opacity-50 cursor-wait' : ''
          }`}
          disabled={isLoading}
        >
          Join the Waitlist
        </button>
      </form>
      {success && (
        <Success closeForm={handleClose} />
      )}
    </motion.div>
  );
}

export default LeadForm;
