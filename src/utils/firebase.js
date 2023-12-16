// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBph8qKGhK9aC8rCiEvZiqyAXeWwV5Rjug",
  authDomain: "streamzgpt.firebaseapp.com",
  projectId: "streamzgpt",
  storageBucket: "streamzgpt.appspot.com",
  messagingSenderId: "741788196167",
  appId: "1:741788196167:web:45a32156b77f3be8584062",
  measurementId: "G-MBW5DRT21S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth();
