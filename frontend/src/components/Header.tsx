"use client"
import { useAuth } from "@/context/AuthContext"

export default function Header() {
  const { logout, userId } = useAuth();
  
  return (
    <header className="global-header">
      <div className="header-search-box">
        <span className="material-symbols-outlined">search</span>
        <input placeholder="Search case law, statutes, or internal research..." type="text"/>
      </div>
      <div className="header-actions-right">
        <nav className="header-nav-links">
          <a className="nav-link-top" href="#">Workspaces</a>
        </nav>
        <button className="btn-icon-top"><span className="material-symbols-outlined">notifications</span></button>
        <button className="btn-icon-top"><span className="material-symbols-outlined">help_center</span></button>
        <div className="avatar-med">
          <img alt="User avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8YB3M67d_HGz_6j8XtPXwdQsj1I4cH5ntGAKmjFI5WvoMMNl6svYyCtZ7ODkTqKALEvQw2RM_QiQnhMTrRcK5TQrE4lgHX0Hzl7-T5tU9AxXCSmqBlPnMyvhzPBTQy_-pmn--TG7SCvS2MC3TZyEWmbRXHFbbQH3CVc7omJXbYm6TzUlAu06I1YyjDgubVPjhkbCSUhjqwM1hMxJ_88jIv3wIflHUFPz2BYKQvaZapsYR9PvC6fIwYgP5ZBu7ThQKwNlB9PVYuvM"/>
        </div>
        <button onClick={logout} className="btn-icon-error" title="Log Out">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  )
}
