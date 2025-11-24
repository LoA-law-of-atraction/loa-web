"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Reviews from "./data/reviews";
import Autoplay from "embla-carousel-autoplay";
import EmblaCarousel from "embla-carousel-react";
import { FaQuoteLeft } from "react-icons/fa6";

const Testimonial = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [emblaRef, emblaApi] = EmblaCarousel(
    {
      loop: true,
      draggable: true,
      align: "center",
      containScroll: "trimSnaps",
      slidesToScroll: isMobile ? 1 : 2,
    },
    [Autoplay()]
  );

  const slidesPerPage = isMobile ? 1 : 2;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (emblaApi) {
      const handleSelect = () => {
        setActiveIndex(emblaApi.selectedScrollSnap());
      };

      emblaApi.on("select", handleSelect);
      return () => emblaApi.off("select", handleSelect);
    }
  }, [emblaApi]);

  const numberOfDots = Math.ceil(Reviews.length / slidesPerPage);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="relative z-10 w-full bg-white text-primary"
    >
      <article className="container mx-auto bg-white relative py-14 p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px] flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-h2 lg:text-h3 font-bold text-center max-w-[80%]">
            What Early Users Are Saying
          </h2>
          <span className="w-16 h-1 mt-3 bg-bg" />

          <article className="flex flex-col items-center justify-center mt-10">
            <p className="mt-5 text-center max-w-[80%] lg:max-w-[60%] lg:leading-8">
              Our beta testers have some wonderful experience to share with you.
              Here are some of the reviews we have received from them.
            </p>
          </article>
        </div>

        <div className="mt-4 bg-white w-full relative">
          <motion.article
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-[100%] bg-white relative top-[3rem]"
          >
            <div className="relative w-full mb-20">
              <div className="embla" ref={emblaRef}>
                <div className="embla__container">
                  {Reviews.map((review, index) => (
                    <div
                      key={index}
                      className="embla__slide px-4 md:max-w-[60%]"
                    >
                      <div className="bg-white border rounded-lg py-12 px-5 shadow-xl relative items-center flex flex-col gap-6 h-full">
                        <FaQuoteLeft className="text-[#505050] text-2xl" />
                        <p className="text-[#505050] leading-relaxed text-center">
                          {review.desc}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 items-start">
                            <h1 className="text-primary font-extrabold text-[16px] leading-[24.55px]">
                              {`- ${review.name},`}
                            </h1>
                            <span className="text-[#091A34] italic">
                              {review.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-[-45px] pt-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                {Array.from({ length: numberOfDots }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi && emblaApi.scrollTo(index)}
                    className={`${
                      activeIndex === index
                        ? "bg-[#505050] w-4 h-2 rounded-full scale-125"
                        : "bg-silver w-3 h-3 rounded-full opacity-60"
                    } transition-all transform`}
                    style={{
                      transition:
                        "transform 0.3s ease-in-out, background-color 0.3s ease",
                    }}
                  ></button>
                ))}
              </div>
            </div>
          </motion.article>
        </div>
      </article>
    </motion.section>
  );
};

export default Testimonial;
