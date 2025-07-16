import { v4 as uuid } from "uuid";

export const privacyPolicy = [
  {
    id: uuid(),
    title: "Information Collection and Use",
    text: "The Application collects certain types of information when you download and use it. This information may include:",
    list: [
      "Device Information: Your device’s Internet Protocol (IP) address, operating system, and other technical data.",
      "Usage Data: Pages visited within the Application, timestamps of visits, time spent on pages, and overall usage time.",
      "Personal Information: The Application may request personally identifiable information such as your name and email address to enhance user experience.",
    ],
    addition:
      "The Application does not collect precise location data from your mobile device.",
    subtext: "The Service Provider may use collected information to:",
    sublist: [
      "Provide important updates, required notices, and marketing promotions.",
      "Improve user experience and functionality.",
    ],
  },
  {
    id: uuid(),
    title: "Third-Party Services",
    text: "The Application uses third-party services that have their own privacy policies regarding data collection and processing. These include:",
    list: ["Google Analytics for Firebase", "Firebase Crashlytics"],
    addition:
      "These services may collect, store, and use your data in accordance with their own privacy policies.",
    subtext:
      "The Service Provider may share collected information with third parties only in the following circumstances:",
    sublist: [
      "Legal Compliance: If required by law, such as responding to legal requests, subpoenas, or government inquiries.",
      "Protection & Security: To protect the rights, safety, and security of users, detect fraud, or enforce legal terms.",
      "Service Providers: With trusted third-party partners that assist in app functionality, provided they comply with data protection standards.",
    ],
  },
  {
    id: uuid(),
    title: "Data Retention and Opt-Out Rights",
    list: [
      "The Service Provider retains user-provided data as long as you use the Application and for a reasonable period afterward.",
      "If you wish to delete your personal data, you may request it by contacting hawk20605@gmail.com.",
      "Secure data storage and access controls to protect against data breaches",
    ],
    addition: "Opt-Out:",
    subtext:
      "You can stop all data collection by uninstalling the Application using standard removal processes on your mobile device or app marketplace.",
  },
  {
    id: uuid(),
    title: "Children's Privacy",
    list: [
      "The Application does not target children under 13 years of age.",
      "The Service Provider does not knowingly collect personal information from children under 13.",
      "If a child under 13 has provided personal data, it will be immediately deleted upon discovery. If you are a parent or guardian and believe your child has provided personal information, please contact hawk20605@gmail.com for prompt action.",
    ],
  },
  {
    id: uuid(),
    title: "Security Measures",
    text: "The Service Provider takes reasonable precautions to safeguard your information, implementing:",
    list: [
      "Encryption protocols for data security.",
      "Physical, electronic, and procedural safeguards to prevent unauthorized access.",
      "Opt-out of marketing communications and data sharing",
    ],
    subtext:
      "However, no internet-based service is 100% secure, and the Service Provider cannot guarantee absolute security.",
  },
  {
    id: uuid(),
    title: "Changes to this Privacy Policy",
    text: "This Privacy Policy may be updated periodically. Any changes will be posted on this page, and you are advised to review it regularly. Continued use of the Application constitutes acceptance of any revised terms.",
  },
  {
    id: uuid(),
    title: "Contact Information",
    text: "For any privacy-related questions or concerns, please contact:",
    list: ["Email: hawk20605@gmail.com"],
  },
];
