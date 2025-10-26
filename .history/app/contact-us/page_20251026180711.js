"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFormik } from "formik";
import Image from "next/image";
import * as Yup from "yup";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { InfinitySpin } from "react-loader-spinner";
import { MdCancel } from "react-icons/md";
import { db } from "@/utils/firebase";
import { addDoc, collection } from "firebase/firestore";

const Contact = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTray, setShowTray] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      comment: "",
      areaOfInterest: {
        loaUsage: false,
        adsSponsorship: false,
        partnership: false,
        others: false,
      },
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      phone: Yup.string().required("Phone Number is required"),
      comment: Yup.string().max(500, "Comment must be at most 500 characters"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const contactsCollectionRef = collection(db, "contacts");
        await addDoc(contactsCollectionRef, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          comment: values.comment,
          areaOfInterest: {
            loaUsage: values.areaOfInterest.loaUsage,
            adsSponsorship: values.areaOfInterest.adsSponsorship,
            partnership: values.areaOfInterest.partnership,
            others: values.areaOfInterest.others,
          },
          timestamp: new Date(),
        });
        setIsLoading(false);
        setShowTray(true);
        formik.resetForm();
      } catch (error) {
        console.error("Error adding document: ", error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      formik.setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [formik, formik.errors]);

  return (
    <>
      {isLoading && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex w-full z-[100] items-center justify-center fixed top-0 left-0 bg-opacity-85 bg-primary"
        >
          <InfinitySpin
            visible
            width="200"
            color="#505050"
            ariaLabel="infinity-spin-loading"
          />
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, x: "-100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ delay: 0.5 }}
        className="min-h-screen w-full"
      >
        <h2 className="text-h2 bg-bg pt-36 pb-20 lg:text-h3 text-white w-full text-center mb-14">
          Contact Us
        </h2>
        <div className="mx-auto px-5 md:px-[5%] pb-20 container max-w-[1200px]">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Need Additional Support?
          </h2>
          <p className="text-gray-700 mb-6 text-center">
            Fill the form below and we will be in touch.
          </p>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onSubmit={formik.handleSubmit}
            className="max-w-[500px] mx-auto flex flex-col justify-center"
          >
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-bold mb-2">
                Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className="shadow appearance-none border rounded w-full h-[41px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Name"
              />
              {formik.touched.name && formik.errors.name ? (
                <div className="text-red-500 text-sm">{formik.errors.name}</div>
              ) : null}
            </div>

            <article className="flex items-center gap-4">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-bold mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  className="shadow appearance-none border rounded w-full h-[41px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Email"
                />
                {formik.touched.email && formik.errors.email ? (
                  <div className="text-red-500 text-sm">
                    {formik.errors.email}
                  </div>
                ) : null}
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-bold mb-2">
                  Phone Number:
                </label>
                <PhoneInput
                  placeholder="Enter phone number"
                  value={formik.values.phone}
                  onChange={(phone) => formik.setFieldValue("phone", phone)}
                  onBlur={() => formik.setFieldTouched("phone", true)}
                  defaultCountry="us"
                  name="phone"
                  international
                />
                {formik.touched.phone && formik.errors.phone ? (
                  <div className="text-red-500 text-sm">
                    {formik.errors.phone}
                  </div>
                ) : null}
              </div>
            </article>

            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-bold mb-2">
                Comment:
              </label>
              <textarea
                name="comment"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.comment}
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Additional details here"
              />
              {formik.touched.comment && formik.errors.comment ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.comment}
                </div>
              ) : null}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Area of Concern:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    name="areaOfInterest.loaUsage"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    checked={formik.values.areaOfInterest.loaUsage}
                  />
                  <span className="ml-2">LoA Usage</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    name="areaOfInterest.adsSponsorship"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    checked={formik.values.areaOfInterest.adsSponsorship}
                  />
                  <span className="ml-2">Ads Sponsorship</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    name="areaOfInterest.partnership"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    checked={formik.values.areaOfInterest.partnership}
                  />
                  <span className="ml-2">Partnership</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    name="areaOfInterest.others"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    checked={formik.values.areaOfInterest.others}
                  />
                  <span className="ml-2">Others</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="bg-black mt-2 active:scale-95 hover:bg-gray-800 transition-all text-white font-bold h-[41px] rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </motion.form>

          <p className="mt-7 text-gray-600 text-center">
            For any inquiries, please use the form above to get in touch with
            us.
          </p>
        </div>
      </motion.section>

      {showTray && (
        <motion.section
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShowTray(false)}
          className="fixed top-0 left-0 z-[500000] w-full h-full bg-black bg-opacity-85 flex items-center justify-center cursor-pointer"
        >
          <MdCancel
            className="absolute left-5 top-10 lg:top-14 lg:left-14 text-2xl cursor-pointer text-white"
            onClick={() => setShowTray(false)}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="text-center bg-primary rounded-[20px] p-4 lg:p-16 py-12 flex flex-col items-center justify-center gap-8"
          >
            <Image
              src="/success.gif"
              alt="Success"
              className="w-[40%]"
              width={100}
              height={100}
            />
            <p className="text-xl text-white font-semibold">
              We got your message! See you soon.
            </p>
          </div>
        </motion.section>
      )}
    </>
  );
};

export default Contact;
