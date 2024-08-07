import React from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { addData, fetchData } from "../js/fetchers";
import { useCurrentUser } from "../contexts/UserContext";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { UserForm } from "../components/UserForm";
import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

export const loader = async () => {
  const response = await fetchData("users");

  if (!response.ok) {
    throw new Error("Could not load users");
  }
  return { users: await response.json() };
};

export const Login = () => {
  const { users } = useLoaderData();
  const { handleCurrentUser } = useCurrentUser();
  const [visible, setVisible] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const toast = useRef(null);
  const navigate = useNavigate();

  const submitForm = async (values) => {
    setSavingForm(true);
    const response = await addData("users", values);
    //const response = await fetch("https://httpstat.us/401");

    const json = await response.json();
    handleCurrentUser(json);
    const newId = json.id;

    if (!response.ok) {
      toast.current.show({
        severity: "error",
        summary: "Account not created",
        detail: "We could not create your account",
        life: 3000,
      });

      setTimeout(() => setVisible(false), 3000);
      setSavingForm(false);
    }

    if (response.ok) {
      toast.current.show({
        severity: "success",
        summary: "Account created",
        detail: "Your account has been created",
        life: 3000,
      });

      setTimeout(() => {
        setSavingForm(false);
        navigate(`/user/${newId}`);
      }, 3000);
    }
  };

  const initialValues = {
    name: "",
    image: "",
  };

  return (
    <div className="flex flex-column align-items-center justify-content-center w-full">
      <Toast ref={toast} />
      <div className="p-card flex flex-column align-items-center justify-content-center gap-4 max-w-30rem w-full mt-8 p-8">
        <h2 className="m-0 ">Select your account</h2>
        {users.map((user) => (
          <Button
            key={user.id}
            value={user}
            className="w-20rem bg-teal-800 border-teal-900 text-white"
            onClick={() => handleCurrentUser(user)}
          >
            <div className="flex flex-column gap-4">
              <div className="flex gap-2 justify-content-center align-items-center">
                <Avatar icon="pi pi-user" image={user.image} shape="circle" />
                <p>{user.name}</p>
              </div>
            </div>
          </Button>
        ))}
        <div className="flex flex-column justify-content-center">
          <p>Is your account not listed?</p>
          <Button
            className="border-teal-700 text-teal-700"
            label="Create a new one"
            onClick={() => setVisible(true)}
            outlined
          />
        </div>
      </div>
      <div className="card flex flex-column justify-content-center">
        <Dialog
          header="Edit profile"
          visible={visible}
          style={{ width: "600px" }}
          onHide={() => setVisible(false)}
        >
          {/* Form starts here */}

          <UserForm
            initialValues={initialValues}
            savingForm={savingForm}
            onSubmit={submitForm}
          />
        </Dialog>
      </div>
    </div>
  );
};
