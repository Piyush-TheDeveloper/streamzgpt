import React, { useRef, useState } from "react";
import { validateForm } from "../utils/validate";
import Header from "./Header";

const Login = () => {
  const [isSignInForm, setIsSignInForm] = useState(true);
  const [errorMessage, setErrorMessage] = useState(false);
  const email = useRef(null);
  const password = useRef(null);

  const toggleSignInForm = () => {
    setIsSignInForm(!isSignInForm);
  };
  const handleButtonClick = () => {
    //Validate Form Data
    const message = validateForm(email.current.value, password.current.value);
    setErrorMessage(message);
  };

  return (
    <div>
      <Header />
      <div className="absolute">
        <img
          src="https://assets.nflxext.com/ffe/siteui/vlv3/b4c7f092-0488-48b7-854d-ca055a84fb4f/5b22968d-b94f-44ec-bea3-45dcf457f29e/IN-en-20231204-popsignuptwoweeks-perspective_alpha_website_large.jpg"
          alt="Logo"
        />
      </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-4/12 absolute rounded-md p-12 bg-black my-36 mx-auto right-0 left-0 text-white bg-opacity-80"
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
        {errorMessage.email && (
          <span className="text-sm m-2 text-red-700 font-semibold">
            {errorMessage.email}
          </span>
        )}
        <input
          type="password"
          placeholder="Password"
          ref={password}
          className="p-4 my-4 bg-[#333] rounded-md w-full"
        />
        {errorMessage.password && (
          <span className="text-sm  m-2 text-red-700 font-semibold">
            {errorMessage.password}
          </span>
        )}
        <button
          className="p-4 my-6 bg-red-700 rounded-md w-full"
          onClick={handleButtonClick}
        >
          {isSignInForm ? "Sign In" : "Sign Up"}
        </button>
        {errorMessage.general && (
          <span className="text-sm  m-2 text-red-700 font-semibold">
            {errorMessage.general}
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
