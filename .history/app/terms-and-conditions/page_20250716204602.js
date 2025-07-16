"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ delay: 0.5 }}
      className="min-h-screen flex items-center flex-col justify-center"
    >
      <h2 className="text-h2 bg-bg pt-36 pb-20 lg:text-h3 text-white w-full text-center mb-14">
        Terms & Conditions
      </h2>
      <div className="mx-auto px-5 md:px-[5%] 2xl:px-0 pb-20 container max-w-[1200px]">
        <article className="flex flex-col gap-5">
          <p className="py-5">Effective Date: July 20, 2024</p>
          <p className="text-base">
            By downloading or using the app, these terms will automatically
            apply to you – you should make sure therefore that you read them
            carefully before using the app. You’re not allowed to copy or modify
            the app, any part of the app, or our trademarks in any way. You’re
            not allowed to attempt to extract the source code of the app, and
            you also shouldn’t try to translate the app into other languages or
            make derivative versions. The app itself, and all the trademarks,
            copyright, database rights, and other intellectual property rights
            related to it, still belong to Banana Sapience.
          </p>
          <p className="text-base">
            Banana Sapience is committed to ensuring that the app is as useful
            and efficient as possible. For that reason, we reserve the right to
            make changes to the app or to charge for its services, at any time
            and for any reason. We will never charge you for the app or its
            services without making it very clear to you exactly what you’re
            paying for.
          </p>
          <p className="text-base">
            The Ever Journal app stores and processes personal data that you
            have provided to us, in order to provide our Service. It’s your
            responsibility to keep your phone and access to the app secure. We
            therefore recommend that you do not jailbreak or root your phone,
            which is the process of removing software restrictions and
            limitations imposed by the official operating system of your device.
            It could make your phone vulnerable to malware/viruses/malicious
            programs, compromise your phone’s security features, and it could
            mean that the Ever Journal app won’t work properly or at all.
          </p>
          <p className="text-base">
            The app does use third-party services that declare their Terms and
            Conditions.
          </p>
          <p className="text-base">
            Link to Terms and Conditions of third-party service providers used
            by the app:
          </p>
          <ul className="list-disc list-inside text-base">
            <li>
              <a
                href="https://firebase.google.com/terms/analytics"
                className="text-[#505050] underline"
              >
                Google Analytics for Firebase
              </a>
            </li>
            <li>
              <a
                href="https://firebase.google.com/terms/crashlytics"
                className="text-[#505050] underline"
              >
                Firebase Crashlytics
              </a>
            </li>
          </ul>
          <p className="text-base">
            You should be aware that there are certain things that Banana
            Sapience will not take responsibility for. Certain functions of the
            app will require the app to have an active internet connection. The
            connection can be Wi-Fi, or provided by your mobile network
            provider, but Banana Sapience cannot take responsibility for the app
            not working at full functionality if you don’t have access to Wi-Fi,
            and you don’t have any of your data allowance left.
          </p>
          <p className="text-base">
            If you’re using the app outside of an area with Wi-Fi, you should
            remember that your terms of the agreement with your mobile network
            provider will still apply. As a result, you may be charged by your
            mobile provider for the cost of data for the duration of the
            connection while accessing the app, or other third-party charges. In
            using the app, you’re accepting responsibility for any such charges,
            including roaming data charges if you use the app outside of your
            home territory (i.e. region or country) without turning off data
            roaming. If you are not the bill payer for the device on which
            you’re using the app, please be aware that we assume that you have
            received permission from the bill payer for using the app.
          </p>
          <p className="text-base">
            Along the same lines, Banana Sapience cannot always take
            responsibility for the way you use the app i.e. You need to make
            sure that your device stays charged – if it runs out of battery and
            you can’t turn it on to avail the Service, Banana Sapience cannot
            accept responsibility.
          </p>
          <p className="text-base">
            With respect to Banana Sapience’s responsibility for your use of the
            app, when you’re using the app, it’s important to bear in mind that
            although we endeavor to ensure that it is updated and correct at all
            times, we do rely on third parties to provide information to us so
            that we can make it available to you. Banana Sapience accepts no
            liability for any loss, direct or indirect, you experience as a
            result of relying wholly on this functionality of the app.
          </p>
          <p className="text-base">
            At some point, we may wish to update the app. The app may receive
            updates to remain compatible with the latest versions of your
            device’s operating system. The requirements for supported systems
            may change, and you’ll need to download updates to continue using
            the app. Banana Sapience does not guarantee that the app will always
            remain compatible with your current device or OS version.
          </p>
          <p className="text-base">
            <strong>Changes to This Terms and Conditions</strong>
          </p>
          <p className="text-base">
            I may update our Terms and Conditions from time to time. Thus, you
            are advised to review this page periodically for any changes. We
            will notify you of any changes by posting the new Terms and
            Conditions on this page.
          </p>
          <p className="text-base">
            These terms and conditions are effective as of 2024-07-20
          </p>
          <p className="text-base">
            <strong>Contact Us</strong>
          </p>
          <p className="text-base">
            If you have any questions or suggestions about my Terms and
            Conditions, do not hesitate to contact us at:
            <a
              href="mailto:hawk20605@gmail.com"
              className="text-[#505050] underline pl-2"
            >
              hawk20605@gmail.com
            </a>
          </p>
        </article>
      </div>
    </motion.section>
  );
};

export default TermsAndConditions;
