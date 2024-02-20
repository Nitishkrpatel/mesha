import PropTypes from "prop-types";
import alertImg from "../assets/alert.svg";
import classes from "./MainNavigation.module.css";
import profileImg from "../assets/profileImg.svg";
import settingImg from "../assets/Settings.svg";

function MainNavigation({ selectedNavLink }) {
  return (
    <header className={classes.header}>
      <div className={classes.leftContent}>
        <h1>{!selectedNavLink ? "Dashboard" : selectedNavLink}</h1>
      </div>
      <div className={classes.rightContent}>
        <img src={alertImg} alt="alert image" className={classes.alertImg} />
        <img
          src={settingImg}
          alt="setting image"
          className={classes.settingImg}
        />
        <p className={classes.profileName}>
          Alicia Zhanisov <span className={classes.role}>Manager</span>
        </p>
        <img
          src={profileImg}
          alt="profile image"
          className={classes.profileImg}
        />
      </div>
    </header>
  );
}

MainNavigation.propTypes = {
  selectedNavLink: PropTypes.string,
};

export default MainNavigation;
