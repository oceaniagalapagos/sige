import { ChangeEvent, useState } from "react";

export default function AuthCallback() {

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handlerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    if (name === 'email') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }))
    } else if (name === 'password') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }))
    }
  }

  const submitHandler = (e: any) => {
    e.preventDefault();

    fetch('http://localhost/sige/users.php', {
      method: 'post',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(e => {
      return e.json();
    }).then(e => {
      if (e.success) {
        location.href = "/dashboard"
      } else {
        location.reload()
      }
    });

  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800">
      <form onSubmit={submitHandler} className="max-w-sm mx-auto">
        <div className="mb-5">
          <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-heading">Your email</label>
          <input name="email" onChange={handlerChange} type="email" id="email" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="name@flowbite.com" required />
        </div>
        <div className="mb-5">
          <label htmlFor="password" className="block mb-2.5 text-sm font-medium text-heading">Your password</label>
          <input name="password" onChange={handlerChange} type="password" id="password" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="••••••••" required />
        </div>
        <button type="submit" className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Submit</button>
      </form>
    </div>
  );
}
