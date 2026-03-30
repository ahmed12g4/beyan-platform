"use client";

import { useState } from "react";

interface Country {
    code: string;
    name: string;
    iso: string;
}

interface CountrySelectorProps {
    selectedCode: string;
    onSelect: (code: string) => void;
}

const countries: Country[] = [
    { code: "+93", name: "Afganistan", iso: "af" },
    { code: "+355", name: "Arnavutluk", iso: "al" },
    { code: "+49", name: "Almanya", iso: "de" },
    { code: "+1", name: "Amerika Birleşik Devletleri", iso: "us" },
    { code: "+376", name: "Andorra", iso: "ad" },
    { code: "+244", name: "Angola", iso: "ao" },
    { code: "+54", name: "Arjantin", iso: "ar" },
    { code: "+61", name: "Avustralya", iso: "au" },
    { code: "+43", name: "Avusturya", iso: "at" },
    { code: "+994", name: "Azerbaycan", iso: "az" },
    { code: "+973", name: "Bahreyn", iso: "bh" },
    { code: "+880", name: "Bangladeş", iso: "bd" },
    { code: "+32", name: "Belçika", iso: "be" },
    { code: "+375", name: "Belarus", iso: "by" },
    { code: "+55", name: "Brezilya", iso: "br" },
    { code: "+44", name: "Birleşik Krallık", iso: "gb" },
    { code: "+971", name: "Birleşik Arap Emirlikleri", iso: "ae" },
    { code: "+359", name: "Bulgaristan", iso: "bg" },
    { code: "+1", name: "Kanada", iso: "ca" },
    { code: "+213", name: "Cezayir", iso: "dz" },
    { code: "+86", name: "Çin", iso: "cn" },
    { code: "+420", name: "Çek Cumhuriyeti", iso: "cz" },
    { code: "+45", name: "Danimarka", iso: "dk" },
    { code: "+20", name: "Mısır", iso: "eg" },
    { code: "+62", name: "Endonezya", iso: "id" },
    { code: "+372", name: "Estonya", iso: "ee" },
    { code: "+251", name: "Etiyopya", iso: "et" },
    { code: "+212", name: "Fas", iso: "ma" },
    { code: "+63", name: "Filipinler", iso: "ph" },
    { code: "+970", name: "Filistin", iso: "ps" },
    { code: "+358", name: "Finlandiya", iso: "fi" },
    { code: "+33", name: "Fransa", iso: "fr" },
    { code: "+233", name: "Gana", iso: "gh" },
    { code: "+995", name: "Gürcistan", iso: "ge" },
    { code: "+27", name: "Güney Afrika", iso: "za" },
    { code: "+82", name: "Güney Kore", iso: "kr" },
    { code: "+91", name: "Hindistan", iso: "in" },
    { code: "+385", name: "Hırvatistan", iso: "hr" },
    { code: "+31", name: "Hollanda", iso: "nl" },
    { code: "+852", name: "Hong Kong", iso: "hk" },
    { code: "+964", name: "Irak", iso: "iq" },
    { code: "+98", name: "İran", iso: "ir" },
    { code: "+353", name: "İrlanda", iso: "ie" },
    { code: "+34", name: "İspanya", iso: "es" },
    { code: "+972", name: "İsrail", iso: "il" },
    { code: "+46", name: "İsveç", iso: "se" },
    { code: "+41", name: "İsviçre", iso: "ch" },
    { code: "+39", name: "İtalya", iso: "it" },
    { code: "+81", name: "Japonya", iso: "jp" },
    { code: "+855", name: "Kamboçya", iso: "kh" },
    { code: "+974", name: "Katar", iso: "qa" },
    { code: "+7", name: "Kazakistan", iso: "kz" },
    { code: "+254", name: "Kenya", iso: "ke" },
    { code: "+996", name: "Kırgızistan", iso: "kg" },
    { code: "+57", name: "Kolombiya", iso: "co" },
    { code: "+965", name: "Kuveyt", iso: "kw" },
    { code: "+389", name: "Kuzey Makedonya", iso: "mk" },
    { code: "+371", name: "Letonya", iso: "lv" },
    { code: "+218", name: "Libya", iso: "ly" },
    { code: "+370", name: "Litvanya", iso: "lt" },
    { code: "+961", name: "Lübnan", iso: "lb" },
    { code: "+352", name: "Lüksemburg", iso: "lu" },
    { code: "+36", name: "Macaristan", iso: "hu" },
    { code: "+60", name: "Malezya", iso: "my" },
    { code: "+356", name: "Malta", iso: "mt" },
    { code: "+52", name: "Meksika", iso: "mx" },
    { code: "+976", name: "Moğolistan", iso: "mn" },
    { code: "+234", name: "Nijerya", iso: "ng" },
    { code: "+47", name: "Norveç", iso: "no" },
    { code: "+968", name: "Umman", iso: "om" },
    { code: "+92", name: "Pakistan", iso: "pk" },
    { code: "+51", name: "Peru", iso: "pe" },
    { code: "+48", name: "Polonya", iso: "pl" },
    { code: "+351", name: "Portekiz", iso: "pt" },
    { code: "+40", name: "Romanya", iso: "ro" },
    { code: "+7", name: "Rusya", iso: "ru" },
    { code: "+966", name: "Suudi Arabistan", iso: "sa" },
    { code: "+381", name: "Sırbistan", iso: "rs" },
    { code: "+65", name: "Singapur", iso: "sg" },
    { code: "+421", name: "Slovakya", iso: "sk" },
    { code: "+386", name: "Slovenya", iso: "si" },
    { code: "+252", name: "Somali", iso: "so" },
    { code: "+94", name: "Sri Lanka", iso: "lk" },
    { code: "+249", name: "Sudan", iso: "sd" },
    { code: "+963", name: "Suriye", iso: "sy" },
    { code: "+886", name: "Tayvan", iso: "tw" },
    { code: "+66", name: "Tayland", iso: "th" },
    { code: "+216", name: "Tunus", iso: "tn" },
    { code: "+90", name: "Türkiye", iso: "tr" },
    { code: "+993", name: "Türkmenistan", iso: "tm" },
    { code: "+256", name: "Uganda", iso: "ug" },
    { code: "+380", name: "Ukrayna", iso: "ua" },
    { code: "+962", name: "Ürdün", iso: "jo" },
    { code: "+998", name: "Özbekistan", iso: "uz" },
    { code: "+58", name: "Venezuela", iso: "ve" },
    { code: "+84", name: "Vietnam", iso: "vn" },
    { code: "+967", name: "Yemen", iso: "ye" },
    { code: "+64", name: "Yeni Zelanda", iso: "nz" },
    { code: "+30", name: "Yunanistan", iso: "gr" },
];

const CountryFlag = ({ iso, size = 24 }: { iso: string; size?: number }) => {
    return (
        <img
            src={`https://flagcdn.com/w40/${iso}.png`}
            alt={iso}
            className="rounded border border-gray-200"
            width={size}
            height={size * 0.67}
            loading="lazy"
        />
    );
};

export default function CountrySelector({ selectedCode, onSelect }: CountrySelectorProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const selectedCountry = countries.find(c => c.code === selectedCode) || countries.find(c => c.iso === "tr")!;

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.includes(searchQuery)
    );

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    setSearchQuery("");
                }}
                className="px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-gray-400 transition-colors flex items-center gap-2 min-w-[125px]"
            >
                <CountryFlag iso={selectedCountry.iso} size={20} />
                <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                <svg className="w-3.5 h-3.5 text-gray-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute z-20 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ülke ara..."
                                    className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
                                    autoFocus
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Countries List */}
                        <div className="max-h-60 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((country, index) => (
                                    <button
                                        key={`${country.code}-${index}`}
                                        type="button"
                                        onClick={() => {
                                            onSelect(country.code);
                                            setShowDropdown(false);
                                            setSearchQuery("");
                                        }}
                                        className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selectedCode === country.code ? 'bg-brand-primary/5' : ''
                                            }`}
                                    >
                                        <CountryFlag iso={country.iso} size={24} />
                                        <span className="text-sm font-medium text-gray-700 flex-1">{country.name}</span>
                                        <span className="text-xs text-gray-500 font-mono">{country.code}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-sm text-gray-500">
                                    Sonuç bulunamadı
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
