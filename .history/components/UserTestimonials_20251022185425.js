"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Digital Marketing Manager",
    avatar: "/avatars/sarah.jpg",
    rating: 5,
    text: "MindfulUsage completely changed how I interact with my phone. The affirmation screens help me pause and think before mindlessly scrolling. I've reduced my social media time by 60% in just two weeks!"
  },
  {
    name: "Marcus Rodriguez",
    role: "Software Developer",
    avatar: "/avatars/marcus.jpg", 
    rating: 5,
    text: "As someone who works with technology all day, I was skeptical about another app. But MindfulUsage actually helps me be more intentional with my personal phone use. The usage tracking opened my eyes to how much time I was wasting."
  },
  {
    name: "Emma Thompson",
    role: "Graduate Student",
    avatar: "/avatars/emma.jpg",
    rating: 5,
    text: "The affirmations feature is incredible! I've set up manifestations for my academic goals, and seeing them before opening distracting apps helps me stay focused. My productivity has improved dramatically."
  },
  {
    name: "David Park",
    role: "Entrepreneur",
    avatar: "/avatars/david.jpg",
    rating: 5,
    text: "I love how this app makes me more conscious of my phone habits without being preachy. The gentle interruptions with positive affirmations create space for reflection. It's like having a mindfulness coach in my pocket."
  },
  {
    name: "Lisa Johnson",
    role: "Teacher",
    avatar: "/avatars/lisa.jpg",
    rating: 5,
    text: "MindfulUsage helped me model better phone behavior for my students. The app usage insights showed me patterns I wasn't aware of, and the affirmation screens help me stay present with my family."
  },
  {
    name: "Alex Kumar",
    role: "Wellness Coach",
    avatar: "/avatars/alex.jpg",
    rating: 5,
    text: "I recommend MindfulUsage to all my clients. It perfectly combines mindfulness with practical behavior change. The ability to customize affirmations for personal goals makes it incredibly powerful."
  }
];

const UserTestimonials = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      className="w-full bg-gray-50 py-16 overflow-hidden"
    >
      <div className="container mx-auto p-4 px-5 md:px-[5%] 2xl:px-0 max-w-[1200px]">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8 } }}
            viewport={{ once: true }}
            className="text-h2 lg:text-h1 font-bold text-gray-900 mb-4"
          >
            What Our Users Are Saying
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Join thousands of people who have transformed their relationship with technology 
            through mindful awareness and intentional phone usage.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.1 } }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <blockquote className="text-gray-700 mb-6 italic">
                "{testimonial.text}"
              </blockquote>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.8 } }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">
              Join Over 50,000 Happy Users
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Start your journey toward more mindful technology use today. 
              Transform every phone interaction into an opportunity for growth and intention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Started Free
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default UserTestimonials;