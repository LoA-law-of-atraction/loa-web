import { motion } from "framer-motion";
import Image from "next/image";
import { MdCancel } from "react-icons/md";
import { useEffect } from "react";

const Success = ({ closeForm }) => {
  useEffect(() => {
    
    if (typeof window !== "undefined") {
      import("react-facebook-pixel")
        .then((ReactPixel) => {
          ReactPixel.init(process.env.NEXT_PUBLIC_META_PIXEL_ID);
          ReactPixel.trackCustom("Lead", {
            content_name: "Waitlist Signup Success",
            content_category: "Waitlist",
          });

          console.log("Meta Pixel Event: Lead triggered");
        })
        .catch((error) => console.error("Meta Pixel Error:", error));
    } else {
      console.log("window is undefined - Meta Pixel not triggered");
    }
  }, []);
  return (
    <motion.section
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => closeForm()}
      className="fixed top-0 left-0 z-5000 w-full h-full bg-black bg-opacity-85 flex items-center justify-center cursor-pointer"
    >
      <MdCancel
        className="absolute left-5 top-10 lg:top-14 lg:left-14 text-2xl cursor-pointer text-white"
        onClick={() => closeForm()}
      />
      <div
        className="text-center bg-primary rounded-[20px] p-4 lg:p-16 py-12 flex flex-col items-center justify-center gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src="/success.gif"
          alt="Success"
          className="w-[40%]"
          width={100}
          height={100}
        />
        <p className="text-xl text-white font-semibold">
          Congrats, You&apos;re in!
        </p>
      </div>
    </motion.section>
  );
};

export default Success;
