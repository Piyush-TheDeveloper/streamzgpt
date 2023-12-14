import React from "react";
import LOGO from "../assets/streamzgpt.png";

const Header = () => {
  return (
    <div className="absolute px-4 py-8 z-10">
      <img className="w-52" src={LOGO} alt="logo" />
    </div>
  );
};

export default Header;
