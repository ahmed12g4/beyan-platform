'use client';

import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface AddToCalendarProps {
    title: string;
    description?: string;
    location?: string;
    startDate: string; // ISO string
    durationMinutes: number;
    buttonClassName?: string;
}

export default function AddToCalendar({
    title,
    description,
    location,
    startDate,
    durationMinutes,
    buttonClassName
}: AddToCalendarProps) {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const checkTime = (i: number) => {
        return (i < 10) ? "0" + i : i;
    }

    const formatDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    }

    const googleUrl = () => {
        const url = new URL('https://calendar.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', title);
        url.searchParams.append('dates', `${formatDate(start)}/${formatDate(end)}`);
        if (description) url.searchParams.append('details', description);
        if (location) url.searchParams.append('location', location);
        return url.toString();
    };

    const outlookUrl = () => {
        const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
        url.searchParams.append('path', '/calendar/action/compose');
        url.searchParams.append('rru', 'addevent');
        url.searchParams.append('startdt', start.toISOString());
        url.searchParams.append('enddt', end.toISOString());
        url.searchParams.append('subject', title);
        if (description) url.searchParams.append('body', description);
        if (location) url.searchParams.append('location', location);
        return url.toString();
    }

    const downloadIcs = () => {
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${document.URL}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${title}
DESCRIPTION:${description || ''}
LOCATION:${location || ''}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${title}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className={buttonClassName || "inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"}>
                    <i className="far fa-calendar-plus mr-2"></i> Takvime Ekle
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-1 py-1 ">
                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href={googleUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${active ? 'bg-brand-primary text-white' : 'text-gray-900'
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                >
                                    <i className="fab fa-google mr-2"></i> Google Calendar
                                </a>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href={outlookUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${active ? 'bg-brand-primary text-white' : 'text-gray-900'
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                >
                                    <i className="fab fa-microsoft mr-2"></i> Outlook
                                </a>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={downloadIcs}
                                    className={`${active ? 'bg-brand-primary text-white' : 'text-gray-900'
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                >
                                    <i className="far fa-file-alt mr-2"></i> iCal / ICS
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
