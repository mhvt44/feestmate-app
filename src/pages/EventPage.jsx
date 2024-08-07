// @ts-nocheck
import React from "react";
import { Button } from "primereact/button";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { redirect, useLoaderData, useNavigate } from "react-router-dom";
import { Dialog } from "primereact/dialog";
import { deleteData, fetchData, updateData } from "../js/fetchers";
import { EventForm } from "../components/EventForm";
import { EventTitle } from "../components/ui/EventTitle";
import { EventDescription } from "../components/ui/EventDescription";
import { EventCreatedBy } from "../components/ui/EventCreatedBy";
import { EventStartTime } from "../components/ui/EventStartTime";
import { EventEndTime } from "../components/ui/EventEndTime";
import { EventLocation } from "../components/ui/EventLocation";
import { EventCategories } from "../components/ui/EventCategories";
import { EventImage } from "../components/ui/EventImage";
import { useCurrentUser } from "../contexts/UserContext";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";

export const loader = async ({ params }) => {
  const event = await fetchData(`events/${params.eventId}`);
  const users = await fetchData("users");
  const categories = await fetchData(`categories`);

  //check for error status and redirect if it's 404
  if (!event.ok) {
    switch (event.status) {
      case 404:
        return redirect("/notfound");

      default:
        throw new Error(
          `Failed to load event. ${event.status} ${event.statusText}`
        );
    }
  }

  if (!users.ok) {
    throw new Error(
      `Failed to load users. ${users.status} ${users.statusText}`
    );
  }

  if (!categories.ok) {
    throw new Error(
      `Failed to load categories. ${categories.status} ${categories.statusText}`
    );
  }

  return {
    event: await event.json(),
    users: await users.json(),
    categories: await categories.json(),
  };
};

export const EventPage = () => {
  const { currentUser } = useCurrentUser();
  const { users, event, categories } = useLoaderData();
  const [visible, setVisible] = useState(false);
  const [savingForm, setSavingForm] = useState(false);

  const navigate = useNavigate();

  const toast = useRef(null); //ref for showing Toast

  //actions taken when users confirms deletion of event
  const accept = async () => {
    const response = await deleteData(`events/${event.id}`);

    if (response.ok) {
      setTimeout(5000);
      toast.current.show({
        severity: "success",
        summary: "Event deleted",
        detail:
          "The event has successfully been deleted. You will be redirected to the Events page",
        life: 5000,
      });
      setTimeout(() => navigate("/events"), 3000);
    }

    if (!response.ok) {
      toast.current.show({
        severity: "error",
        summary: "Event not deleted",
        detail: `Event could not be deleted. (${response.status} ${response.statusText})`,
        life: 5000,
      });
    }
  };

  //actions taken when users cancels deletion of event
  const reject = () => {
    toast.current.show({
      severity: "error",
      summary: "Event not deleted",
      detail: "Event has not been deleted",
      life: 5000,
    });
  };

  //Delete button popover
  const handleDelete = (e) => {
    confirmPopup({
      target: e.currentTarget,
      message: "Do you really want to delete this event?",
      icon: "pi pi-info-circle",
      acceptClassName: "p-button-danger",
      accept,
      reject,
    });
  };

  //Initial values for event edit form
  const initialValues = {
    createdBy: event.createdBy,
    title: event.title,
    description: event.description,
    image: event.image,
    categoryIds: event.categoryIds,
    location: event.location,
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
  };

  //action taken when form is saved
  const submitForm = async (values) => {
    setSavingForm(true);
    const response = await updateData(`events/${event.id}`, values);

    if (response.ok) {
      toast.current.show({
        severity: "success",
        summary: "Event updated",
        detail: "The event has succesfully been updated",
        life: 5000,
      });
      setVisible(false);
      setSavingForm(false);
      navigate(`/event/${event.id}`);
    }

    if (!response.ok) {
      toast.current.show({
        severity: "error",
        summary: "Event not updatet",
        detail: `Event could not be updatet (${response.status} ${response.statusText})`,
        life: 5000,
      });
      setVisible(false);
      setSavingForm(false);
    }
  };

  return (
    <div className="max-w-1200  w-full">
      <h1 className="text-white font-bold text-7xl ml-0 m-4 uppercase">
        EVENT
      </h1>

      <div className="p-card p-4 flex flex-column w-full max-w-1200 h-fit">
        <div className="flex h-full flex-column md:flex-row w-full">
          <div className="w-full md:w-8">
            <div className="flex flex-column w-full">
              <div className="flex gap-1">
                <Button
                  icon="pi pi-arrow-left"
                  rounded
                  text
                  onClick={() => navigate(-1)}
                />
                <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  onClick={() => setVisible(true)}
                  disabled={!currentUser}
                />
                <Toast ref={toast} />
                <ConfirmPopup />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  onClick={handleDelete}
                  disabled={!currentUser}
                  rounded
                  text
                />
              </div>
              <div
                className={classNames({
                  "p-hidden": currentUser,
                  "mt-3": true,
                  "w-full": true,
                })}
              >
                <Message
                  severity="warn"
                  text="You have to login to edit or delete events"
                />
              </div>
            </div>

            <div className="flex flex-column justify-content-center">
              <EventTitle title={event.title} />
              <EventDescription description={event.description} />

              {new Date(event.startTime) < new Date() ? (
                <Message
                  severity="warn"
                  text="You've missed this event!"
                  style={{ height: "2rem" }}
                  className="mt-2 mr-4 w-16rem"
                />
              ) : null}
              <EventStartTime date={event.startTime} />
              <EventEndTime date={event.endTime} />

              <EventLocation location={event.location} />

              <EventCategories
                categories={categories}
                categoryIds={event.categoryIds}
              />
              <EventCreatedBy users={users} createdBy={event.createdBy} />
            </div>
          </div>

          <div className="w-full  md:w-8 m-0 p-0">
            <EventImage imageURL={event.image} />
          </div>
        </div>
      </div>

      <div className="card flex flex-column justify-content-center">
        <Dialog
          header="Edit event"
          visible={visible}
          style={{ width: "600px" }}
          onHide={() => setVisible(false)}
        >
          <EventForm
            initialValues={initialValues}
            categories={categories}
            onSubmit={submitForm}
            savingForm={savingForm}
          />
        </Dialog>
      </div>
    </div>
  );
};
