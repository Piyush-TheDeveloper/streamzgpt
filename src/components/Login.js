import React, { useRef, useState } from "react";
import { validateForm } from "../utils/validate";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import Header from "./Header";
import { auth } from "../utils/firebase";

const Login = () => {
  const [isSignInForm, setIsSignInForm] = useState(true);
  const [errorMessage, setErrorMessage] = useState(false);
  const [loader, setLoader] = useState(false);
  const email = useRef(null);
  const password = useRef(null);

  const toggleSignInForm = () => {
    setIsSignInForm(!isSignInForm);
  };
  const handleButtonClick = () => {
    console.log(
      "am here ",
      !isSignInForm,
      auth,
      email.current.value,
      password.current.value
    );
    //Validate Form Data
    const message = validateForm(email.current.value, password.current.value);
    setErrorMessage(message);
    if (message.success) return;

    /*******SignIn/SignUp Logic Starts here************/
    setLoader(true);
    if (!isSignInForm) {
      //Sign Up Logic
      console.log("am in if ");
      createUserWithEmailAndPassword(
        auth,
        email.current.value,
        password.current.value
      )
        .then((userCredential) => {
          // Signed up
          setLoader(false);
          console.log(userCredential);
          const user = userCredential.user;
          console.log(user);
          // ...
        })
        .catch((error) => {
          setLoader(false);
          // const errorCode = error.code;
          const errorMessage = error.message;
          setErrorMessage({
            success: true,
            msg:
              errorMessage === "Firebase: Error (auth/email-already-in-use)."
                ? "User already exist"
                : "",
          });
          // ..
        });
    } else {
      //Sign In Logic
      signInWithEmailAndPassword(
        auth,
        email.current.value,
        password.current.value
      )
        .then((userCredential) => {
          setLoader(false);
          const user = userCredential.user;
          console.log(user);
        })
        .catch((error) => {
          setLoader(false);
          const errorMessage = error.message;
          setErrorMessage({
            success: true,
            msg:
              errorMessage === "Firebase: Error (auth/invalid-credential)."
                ? "User Doesn't Exist"
                : "",
          });
          console.log(errorMessage);
        });
    }
  };

  return (
    <div className="">
      <Header />
      <div className="absolute bg-gradient-to-b from-gray-800 to-gray-600">
        <img
          className="mix-blend-overlay"
          src="https://assets.nflxext.com/ffe/siteui/vlv3/b4c7f092-0488-48b7-854d-ca055a84fb4f/5b22968d-b94f-44ec-bea3-45dcf457f29e/IN-en-20231204-popsignuptwoweeks-perspective_alpha_website_large.jpg"
          alt="Logo"
        />
      </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-3/12 absolute rounded-md p-12 bg-black my-36 mx-auto right-0 left-0 text-white bg-opacity-75"
      >
        <h1 className="font-bold text-3xl py-4">
          {isSignInForm ? "Sign In" : "Sign Up"}
        </h1>
        {!isSignInForm && (
          <input
            type="text"
            placeholder="Full Name"
            className="p-4 my-4 bg-[#333] rounded-md w-full"
          />
        )}
        <input
          type="text"
          placeholder="Email Address"
          ref={email}
          className="p-4 my-4 bg-[#333] rounded-md w-full"
        />
        <input
          type="password"
          placeholder="Password"
          ref={password}
          autoComplete="on"
          className="p-4 my-4 bg-[#333] rounded-md w-full"
        />

        <button
          className="p-4 my-6 bg-red-700 rounded-md w-full"
          onClick={handleButtonClick}
        >
          {loader ? <p>Loading...</p> : isSignInForm ? "Sign In" : "Sign Up"}
        </button>
        {errorMessage.msg && (
          <span className="text-sm  m-2 text-[#e87c03]">
            {errorMessage.msg}
          </span>
        )}
        <p onClick={toggleSignInForm} className="py-4 m-2 cursor-pointer">
          {isSignInForm ? (
            <span>
              New to Netflix? <u>Sign Up here</u>
            </span>
          ) : (
            <span>
              Already Registered? <u>Sign In Now</u>
            </span>
          )}
        </p>
      </form>
    </div>
  );
};

export default Login;
