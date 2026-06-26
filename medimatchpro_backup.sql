--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    date timestamp without time zone NOT NULL,
    duration integer NOT NULL,
    status text NOT NULL,
    type text NOT NULL,
    reason_for_visit text,
    notes text,
    symptoms text[],
    created_at timestamp without time zone DEFAULT now(),
    meeting_link text,
    calendar_event_id text
);


ALTER TABLE public.appointments OWNER TO medimatch;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.appointments_id_seq OWNER TO medimatch;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: availability; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.availability (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    day_of_week integer NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    is_available boolean DEFAULT true
);


ALTER TABLE public.availability OWNER TO medimatch;

--
-- Name: availability_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.availability_id_seq OWNER TO medimatch;

--
-- Name: availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.availability_id_seq OWNED BY public.availability.id;


--
-- Name: doctor_symptoms; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.doctor_symptoms (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    symptom_id integer NOT NULL,
    expertise integer DEFAULT 1
);


ALTER TABLE public.doctor_symptoms OWNER TO medimatch;

--
-- Name: doctor_symptoms_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.doctor_symptoms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.doctor_symptoms_id_seq OWNER TO medimatch;

--
-- Name: doctor_symptoms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.doctor_symptoms_id_seq OWNED BY public.doctor_symptoms.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    user_id integer NOT NULL,
    specialty text NOT NULL,
    experience integer NOT NULL,
    hospital_affiliation text,
    education text,
    license_number text,
    accepting_new_patients boolean DEFAULT true,
    about text,
    profile_picture text,
    rating integer,
    review_count integer DEFAULT 0
);


ALTER TABLE public.doctors OWNER TO medimatch;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.doctors_id_seq OWNER TO medimatch;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: health_records; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.health_records (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    record_type text NOT NULL,
    name text NOT NULL,
    details text,
    date timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.health_records OWNER TO medimatch;

--
-- Name: health_records_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.health_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.health_records_id_seq OWNER TO medimatch;

--
-- Name: health_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.health_records_id_seq OWNED BY public.health_records.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date_of_birth timestamp without time zone,
    gender text,
    phone text,
    address text,
    city text,
    state text,
    zip_code text,
    insurance_provider text,
    insurance_policy_number text,
    blood_type text,
    profile_picture text
);


ALTER TABLE public.patients OWNER TO medimatch;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.patients_id_seq OWNER TO medimatch;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.reminders (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    is_completed boolean DEFAULT false,
    type text NOT NULL
);


ALTER TABLE public.reminders OWNER TO medimatch;

--
-- Name: reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reminders_id_seq OWNER TO medimatch;

--
-- Name: reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.reminders_id_seq OWNED BY public.reminders.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO medimatch;

--
-- Name: specialties; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.specialties (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category text
);


ALTER TABLE public.specialties OWNER TO medimatch;

--
-- Name: specialties_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.specialties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.specialties_id_seq OWNER TO medimatch;

--
-- Name: specialties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.specialties_id_seq OWNED BY public.specialties.id;


--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.symptoms (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    body_part text,
    severity text
);


ALTER TABLE public.symptoms OWNER TO medimatch;

--
-- Name: symptoms_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.symptoms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.symptoms_id_seq OWNER TO medimatch;

--
-- Name: symptoms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.symptoms_id_seq OWNED BY public.symptoms.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: medimatch
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    user_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO medimatch;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: medimatch
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO medimatch;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medimatch
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: availability id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.availability ALTER COLUMN id SET DEFAULT nextval('public.availability_id_seq'::regclass);


--
-- Name: doctor_symptoms id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctor_symptoms ALTER COLUMN id SET DEFAULT nextval('public.doctor_symptoms_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: health_records id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.health_records ALTER COLUMN id SET DEFAULT nextval('public.health_records_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: reminders id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.reminders ALTER COLUMN id SET DEFAULT nextval('public.reminders_id_seq'::regclass);


--
-- Name: specialties id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.specialties ALTER COLUMN id SET DEFAULT nextval('public.specialties_id_seq'::regclass);


--
-- Name: symptoms id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.symptoms ALTER COLUMN id SET DEFAULT nextval('public.symptoms_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.appointments (id, patient_id, doctor_id, date, duration, status, type, reason_for_visit, notes, symptoms, created_at, meeting_link, calendar_event_id) FROM stdin;
1	1	1	2025-07-05 10:00:00	30	pending	in-person	First test appointment	\N	{}	2025-07-04 11:54:39.870357	\N	\N
2	1	1	2025-07-05 10:30:00	30	pending	video	Non-conflicting test appointment	\N	{}	2025-07-04 11:55:45.673989	\N	\N
\.


--
-- Data for Name: availability; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.availability (id, doctor_id, day_of_week, start_time, end_time, is_available) FROM stdin;
1	1	1	13:00	13:30	t
2	1	1	14:30	15:00	t
3	1	1	10:30	11:00	t
4	1	1	09:00	09:30	t
5	1	1	14:00	14:30	t
6	1	1	09:30	10:00	t
7	1	1	16:30	17:00	t
8	1	1	15:30	16:00	t
9	1	1	15:00	15:30	t
10	1	2	14:00	14:30	t
11	1	2	09:00	09:30	t
12	1	2	14:30	15:00	t
13	1	2	16:00	16:30	t
14	1	2	15:00	15:30	t
15	1	2	10:30	11:00	t
16	1	2	16:30	17:00	t
17	1	2	15:30	16:00	t
18	1	2	11:30	12:00	t
19	1	3	10:00	10:30	t
20	1	3	14:00	14:30	t
21	1	3	16:30	17:00	t
22	1	3	09:30	10:00	t
23	1	3	09:00	09:30	t
24	1	3	14:30	15:00	t
25	1	3	15:30	16:00	t
26	1	3	10:30	11:00	t
27	1	4	09:00	09:30	t
28	1	4	09:30	10:00	t
29	1	4	10:30	11:00	t
30	1	4	16:30	17:00	t
31	1	4	14:30	15:00	t
32	1	4	11:00	11:30	t
33	1	4	15:30	16:00	t
34	1	4	10:00	10:30	t
35	1	4	13:00	13:30	t
36	1	4	11:30	12:00	t
37	1	5	15:00	15:30	t
38	1	5	09:00	09:30	t
39	1	5	16:00	16:30	t
40	1	5	15:30	16:00	t
41	1	5	11:30	12:00	t
42	1	5	09:30	10:00	t
43	1	5	10:00	10:30	t
44	1	5	13:30	14:00	t
45	1	5	13:00	13:30	t
46	1	5	14:30	15:00	t
47	2	1	14:30	15:00	t
48	2	1	13:00	13:30	t
49	2	1	15:00	15:30	t
50	2	1	10:30	11:00	t
51	2	1	15:30	16:00	t
52	2	1	13:30	14:00	t
53	2	1	09:30	10:00	t
54	2	1	14:00	14:30	t
55	2	1	09:00	09:30	t
56	2	2	10:00	10:30	t
57	2	2	16:00	16:30	t
58	2	2	09:30	10:00	t
59	2	2	15:30	16:00	t
60	2	2	10:30	11:00	t
61	2	2	13:30	14:00	t
62	2	2	13:00	13:30	t
63	2	3	10:30	11:00	t
64	2	3	15:00	15:30	t
65	2	3	16:00	16:30	t
66	2	3	13:30	14:00	t
67	2	3	14:30	15:00	t
68	2	3	10:00	10:30	t
69	2	3	09:30	10:00	t
70	2	3	14:00	14:30	t
71	2	3	13:00	13:30	t
72	2	3	15:30	16:00	t
73	2	4	14:00	14:30	t
74	2	4	13:30	14:00	t
75	2	4	16:30	17:00	t
76	2	4	15:30	16:00	t
77	2	4	13:00	13:30	t
78	2	4	09:30	10:00	t
79	2	4	14:30	15:00	t
80	2	4	09:00	09:30	t
81	2	4	11:00	11:30	t
82	2	4	10:00	10:30	t
83	2	5	15:00	15:30	t
84	2	5	15:30	16:00	t
85	2	5	10:00	10:30	t
86	2	5	14:30	15:00	t
87	2	5	09:30	10:00	t
88	2	5	11:00	11:30	t
89	2	5	16:30	17:00	t
90	2	5	09:00	09:30	t
91	2	5	13:30	14:00	t
92	2	5	16:00	16:30	t
93	3	1	11:30	12:00	t
94	3	1	15:30	16:00	t
95	3	1	10:30	11:00	t
96	3	1	14:00	14:30	t
97	3	1	09:00	09:30	t
98	3	1	09:30	10:00	t
99	3	1	13:30	14:00	t
100	3	1	16:00	16:30	t
101	3	1	13:00	13:30	t
102	3	2	14:30	15:00	t
103	3	2	10:30	11:00	t
104	3	2	09:00	09:30	t
105	3	2	11:00	11:30	t
106	3	2	16:30	17:00	t
107	3	2	15:30	16:00	t
108	3	2	09:30	10:00	t
109	3	2	15:00	15:30	t
110	3	3	10:30	11:00	t
111	3	3	13:00	13:30	t
112	3	3	09:00	09:30	t
113	3	3	09:30	10:00	t
114	3	3	11:00	11:30	t
115	3	3	15:00	15:30	t
116	3	3	14:00	14:30	t
117	3	4	15:00	15:30	t
118	3	4	13:30	14:00	t
119	3	4	16:00	16:30	t
120	3	4	10:30	11:00	t
121	3	4	14:30	15:00	t
122	3	4	14:00	14:30	t
123	3	4	09:30	10:00	t
124	3	4	16:30	17:00	t
125	3	5	10:30	11:00	t
126	3	5	10:00	10:30	t
127	3	5	14:30	15:00	t
128	3	5	16:00	16:30	t
129	3	5	14:00	14:30	t
130	3	5	15:30	16:00	t
131	3	5	11:30	12:00	t
132	3	5	13:00	13:30	t
133	3	5	11:00	11:30	t
134	4	1	14:30	15:00	t
135	4	1	09:00	09:30	t
136	4	1	11:00	11:30	t
137	4	1	16:00	16:30	t
138	4	1	09:30	10:00	t
139	4	1	14:00	14:30	t
140	4	1	16:30	17:00	t
141	4	1	15:30	16:00	t
142	4	1	10:30	11:00	t
143	4	1	13:00	13:30	t
144	4	2	10:00	10:30	t
145	4	2	13:00	13:30	t
146	4	2	09:30	10:00	t
147	4	2	16:00	16:30	t
148	4	2	11:00	11:30	t
149	4	2	16:30	17:00	t
150	4	2	14:30	15:00	t
151	4	2	15:00	15:30	t
152	4	2	15:30	16:00	t
153	4	3	10:30	11:00	t
154	4	3	11:00	11:30	t
155	4	3	13:00	13:30	t
156	4	3	11:30	12:00	t
157	4	3	13:30	14:00	t
158	4	3	09:00	09:30	t
159	4	3	16:30	17:00	t
160	4	4	15:00	15:30	t
161	4	4	10:30	11:00	t
162	4	4	11:30	12:00	t
163	4	4	10:00	10:30	t
164	4	4	14:00	14:30	t
165	4	4	09:30	10:00	t
166	4	4	16:30	17:00	t
167	4	4	09:00	09:30	t
168	4	4	13:30	14:00	t
169	4	5	10:30	11:00	t
170	4	5	10:00	10:30	t
171	4	5	13:30	14:00	t
172	4	5	09:30	10:00	t
173	4	5	11:00	11:30	t
174	4	5	15:00	15:30	t
175	4	5	16:30	17:00	t
176	4	5	16:00	16:30	t
177	4	5	15:30	16:00	t
178	4	5	11:30	12:00	t
179	5	1	09:00	09:30	t
180	5	1	16:30	17:00	t
181	5	1	11:30	12:00	t
182	5	1	09:30	10:00	t
183	5	1	10:00	10:30	t
184	5	1	14:00	14:30	t
185	5	1	11:00	11:30	t
186	5	2	13:30	14:00	t
187	5	2	10:30	11:00	t
188	5	2	13:00	13:30	t
189	5	2	15:00	15:30	t
190	5	2	15:30	16:00	t
191	5	2	10:00	10:30	t
192	5	2	11:30	12:00	t
193	5	3	15:00	15:30	t
194	5	3	10:00	10:30	t
195	5	3	16:30	17:00	t
196	5	3	09:30	10:00	t
197	5	3	10:30	11:00	t
198	5	3	13:00	13:30	t
199	5	3	16:00	16:30	t
200	5	3	13:30	14:00	t
201	5	4	09:00	09:30	t
202	5	4	10:00	10:30	t
203	5	4	13:30	14:00	t
204	5	4	16:00	16:30	t
205	5	4	10:30	11:00	t
206	5	4	16:30	17:00	t
207	5	4	13:00	13:30	t
208	5	4	14:30	15:00	t
209	5	5	10:30	11:00	t
210	5	5	15:30	16:00	t
211	5	5	09:00	09:30	t
212	5	5	14:00	14:30	t
213	5	5	09:30	10:00	t
214	5	5	15:00	15:30	t
215	5	5	16:30	17:00	t
216	5	5	13:30	14:00	t
217	5	5	16:00	16:30	t
218	6	1	16:30	17:00	t
219	6	1	11:30	12:00	t
220	6	1	14:00	14:30	t
221	6	1	14:30	15:00	t
222	6	1	09:30	10:00	t
223	6	1	13:00	13:30	t
224	6	1	15:30	16:00	t
225	6	2	13:30	14:00	t
226	6	2	10:30	11:00	t
227	6	2	10:00	10:30	t
228	6	2	11:00	11:30	t
229	6	2	14:30	15:00	t
230	6	2	09:30	10:00	t
231	6	2	14:00	14:30	t
232	6	2	15:30	16:00	t
233	6	2	16:00	16:30	t
234	6	3	15:30	16:00	t
235	6	3	11:30	12:00	t
236	6	3	16:30	17:00	t
237	6	3	13:30	14:00	t
238	6	3	09:30	10:00	t
239	6	3	14:30	15:00	t
240	6	3	10:00	10:30	t
241	6	4	15:30	16:00	t
242	6	4	10:30	11:00	t
243	6	4	16:30	17:00	t
244	6	4	14:30	15:00	t
245	6	4	13:30	14:00	t
246	6	4	09:30	10:00	t
247	6	4	13:00	13:30	t
248	6	4	16:00	16:30	t
249	6	4	11:30	12:00	t
250	6	4	15:00	15:30	t
251	6	4	09:00	09:30	t
252	6	5	13:00	13:30	t
253	6	5	09:00	09:30	t
254	6	5	09:30	10:00	t
255	6	5	11:00	11:30	t
256	6	5	15:30	16:00	t
257	6	5	10:30	11:00	t
258	6	5	14:30	15:00	t
259	6	5	10:00	10:30	t
260	7	1	11:30	12:00	t
261	7	1	11:00	11:30	t
262	7	1	10:30	11:00	t
263	7	1	13:30	14:00	t
264	7	1	10:00	10:30	t
265	7	1	09:30	10:00	t
266	7	1	16:30	17:00	t
267	7	1	09:00	09:30	t
268	7	1	15:30	16:00	t
269	7	1	14:30	15:00	t
270	7	2	10:00	10:30	t
271	7	2	10:30	11:00	t
272	7	2	11:00	11:30	t
273	7	2	13:30	14:00	t
274	7	2	16:30	17:00	t
275	7	2	11:30	12:00	t
276	7	2	16:00	16:30	t
277	7	3	09:30	10:00	t
278	7	3	13:30	14:00	t
279	7	3	10:30	11:00	t
280	7	3	14:00	14:30	t
281	7	3	11:30	12:00	t
282	7	3	16:30	17:00	t
283	7	3	09:00	09:30	t
284	7	3	11:00	11:30	t
285	7	4	13:00	13:30	t
286	7	4	10:30	11:00	t
287	7	4	10:00	10:30	t
288	7	4	13:30	14:00	t
289	7	4	11:30	12:00	t
290	7	4	14:30	15:00	t
291	7	4	16:30	17:00	t
292	7	5	16:00	16:30	t
293	7	5	14:00	14:30	t
294	7	5	09:30	10:00	t
295	7	5	10:30	11:00	t
296	7	5	15:00	15:30	t
297	7	5	09:00	09:30	t
298	7	5	11:00	11:30	t
299	7	5	10:00	10:30	t
300	7	5	11:30	12:00	t
301	7	5	13:30	14:00	t
302	7	5	15:30	16:00	t
303	8	1	13:00	13:30	t
304	8	1	09:30	10:00	t
305	8	1	14:30	15:00	t
306	8	1	11:30	12:00	t
307	8	1	09:00	09:30	t
308	8	1	11:00	11:30	t
309	8	1	14:00	14:30	t
310	8	1	13:30	14:00	t
311	8	2	10:00	10:30	t
312	8	2	13:30	14:00	t
313	8	2	10:30	11:00	t
314	8	2	11:00	11:30	t
315	8	2	16:00	16:30	t
316	8	2	13:00	13:30	t
317	8	2	14:00	14:30	t
318	8	2	14:30	15:00	t
319	8	2	15:00	15:30	t
320	8	3	11:30	12:00	t
321	8	3	10:30	11:00	t
322	8	3	16:30	17:00	t
323	8	3	14:30	15:00	t
324	8	3	16:00	16:30	t
325	8	3	13:00	13:30	t
326	8	3	10:00	10:30	t
327	8	3	15:00	15:30	t
328	8	3	13:30	14:00	t
329	8	3	09:30	10:00	t
330	8	3	11:00	11:30	t
331	8	4	15:30	16:00	t
332	8	4	10:00	10:30	t
333	8	4	11:30	12:00	t
334	8	4	09:30	10:00	t
335	8	4	13:00	13:30	t
336	8	4	10:30	11:00	t
337	8	4	09:00	09:30	t
338	8	4	16:30	17:00	t
339	8	4	16:00	16:30	t
340	8	4	13:30	14:00	t
341	8	5	16:00	16:30	t
342	8	5	11:30	12:00	t
343	8	5	15:00	15:30	t
344	8	5	14:30	15:00	t
345	8	5	09:30	10:00	t
346	8	5	11:00	11:30	t
347	8	5	13:00	13:30	t
348	8	5	10:30	11:00	t
349	8	5	14:00	14:30	t
350	9	1	10:00	10:30	t
351	9	1	14:30	15:00	t
352	9	1	11:30	12:00	t
353	9	1	15:30	16:00	t
354	9	1	13:30	14:00	t
355	9	1	14:00	14:30	t
356	9	1	10:30	11:00	t
357	9	2	13:00	13:30	t
358	9	2	11:30	12:00	t
359	9	2	15:30	16:00	t
360	9	2	09:30	10:00	t
361	9	2	09:00	09:30	t
362	9	2	11:00	11:30	t
363	9	2	14:00	14:30	t
364	9	2	15:00	15:30	t
365	9	2	10:30	11:00	t
366	9	3	14:30	15:00	t
367	9	3	10:30	11:00	t
368	9	3	09:30	10:00	t
369	9	3	11:30	12:00	t
370	9	3	15:30	16:00	t
371	9	3	16:00	16:30	t
372	9	3	10:00	10:30	t
373	9	3	09:00	09:30	t
374	9	3	14:00	14:30	t
375	9	3	16:30	17:00	t
376	9	4	09:00	09:30	t
377	9	4	14:00	14:30	t
378	9	4	11:30	12:00	t
379	9	4	15:00	15:30	t
380	9	4	09:30	10:00	t
381	9	4	14:30	15:00	t
382	9	4	16:30	17:00	t
383	9	4	16:00	16:30	t
384	9	5	10:30	11:00	t
385	9	5	16:30	17:00	t
386	9	5	11:00	11:30	t
387	9	5	14:30	15:00	t
388	9	5	13:30	14:00	t
389	9	5	10:00	10:30	t
390	9	5	09:30	10:00	t
391	9	5	13:00	13:30	t
392	9	5	15:00	15:30	t
393	9	5	09:00	09:30	t
394	9	5	16:00	16:30	t
395	10	1	09:00	09:30	t
396	10	1	09:30	10:00	t
397	10	1	14:30	15:00	t
398	10	1	16:00	16:30	t
399	10	1	10:00	10:30	t
400	10	1	10:30	11:00	t
401	10	1	15:30	16:00	t
402	10	1	15:00	15:30	t
403	10	1	13:30	14:00	t
404	10	1	13:00	13:30	t
405	10	2	16:00	16:30	t
406	10	2	14:00	14:30	t
407	10	2	10:30	11:00	t
408	10	2	15:30	16:00	t
409	10	2	09:00	09:30	t
410	10	2	10:00	10:30	t
411	10	2	11:30	12:00	t
412	10	2	11:00	11:30	t
413	10	2	13:30	14:00	t
414	10	2	14:30	15:00	t
415	10	3	13:30	14:00	t
416	10	3	13:00	13:30	t
417	10	3	14:30	15:00	t
418	10	3	10:30	11:00	t
419	10	3	15:00	15:30	t
420	10	3	10:00	10:30	t
421	10	3	16:30	17:00	t
422	10	3	16:00	16:30	t
423	10	3	14:00	14:30	t
424	10	4	11:30	12:00	t
425	10	4	09:30	10:00	t
426	10	4	11:00	11:30	t
427	10	4	14:30	15:00	t
428	10	4	14:00	14:30	t
429	10	4	16:30	17:00	t
430	10	4	13:30	14:00	t
431	10	4	09:00	09:30	t
432	10	4	10:00	10:30	t
433	10	4	15:00	15:30	t
434	10	5	13:30	14:00	t
435	10	5	13:00	13:30	t
436	10	5	15:00	15:30	t
437	10	5	16:30	17:00	t
438	10	5	11:30	12:00	t
439	10	5	14:00	14:30	t
440	10	5	15:30	16:00	t
441	10	5	14:30	15:00	t
442	10	5	11:00	11:30	t
443	10	5	10:30	11:00	t
444	10	5	16:00	16:30	t
445	11	1	13:30	14:00	t
446	11	1	16:30	17:00	t
447	11	1	15:30	16:00	t
448	11	1	09:00	09:30	t
449	11	1	10:30	11:00	t
450	11	1	11:00	11:30	t
451	11	1	14:30	15:00	t
452	11	1	16:00	16:30	t
453	11	2	13:00	13:30	t
454	11	2	09:30	10:00	t
455	11	2	15:30	16:00	t
456	11	2	10:00	10:30	t
457	11	2	11:00	11:30	t
458	11	2	10:30	11:00	t
459	11	2	11:30	12:00	t
460	11	2	13:30	14:00	t
461	11	3	09:00	09:30	t
462	11	3	16:00	16:30	t
463	11	3	14:00	14:30	t
464	11	3	10:00	10:30	t
465	11	3	14:30	15:00	t
466	11	3	13:00	13:30	t
467	11	3	11:30	12:00	t
468	11	3	15:00	15:30	t
469	11	3	10:30	11:00	t
470	11	3	16:30	17:00	t
471	11	3	15:30	16:00	t
472	11	4	09:30	10:00	t
473	11	4	13:30	14:00	t
474	11	4	15:30	16:00	t
475	11	4	13:00	13:30	t
476	11	4	10:30	11:00	t
477	11	4	14:00	14:30	t
478	11	4	16:30	17:00	t
479	11	4	09:00	09:30	t
480	11	4	10:00	10:30	t
481	11	4	11:00	11:30	t
482	11	5	10:00	10:30	t
483	11	5	15:30	16:00	t
484	11	5	13:00	13:30	t
485	11	5	14:00	14:30	t
486	11	5	09:30	10:00	t
487	11	5	15:00	15:30	t
488	11	5	16:30	17:00	t
489	11	5	16:00	16:30	t
490	12	1	13:00	13:30	t
491	12	1	15:30	16:00	t
492	12	1	09:00	09:30	t
493	12	1	15:00	15:30	t
494	12	1	16:00	16:30	t
495	12	1	16:30	17:00	t
496	12	1	09:30	10:00	t
497	12	1	14:30	15:00	t
498	12	1	13:30	14:00	t
499	12	2	16:00	16:30	t
500	12	2	11:30	12:00	t
501	12	2	13:30	14:00	t
502	12	2	11:00	11:30	t
503	12	2	10:30	11:00	t
504	12	2	10:00	10:30	t
505	12	2	16:30	17:00	t
506	12	2	14:00	14:30	t
507	12	2	14:30	15:00	t
508	12	2	09:30	10:00	t
509	12	3	09:30	10:00	t
510	12	3	15:30	16:00	t
511	12	3	09:00	09:30	t
512	12	3	15:00	15:30	t
513	12	3	10:00	10:30	t
514	12	3	10:30	11:00	t
515	12	3	13:30	14:00	t
516	12	3	16:00	16:30	t
517	12	3	11:30	12:00	t
518	12	3	14:00	14:30	t
519	12	4	09:00	09:30	t
520	12	4	09:30	10:00	t
521	12	4	15:00	15:30	t
522	12	4	10:00	10:30	t
523	12	4	10:30	11:00	t
524	12	4	13:30	14:00	t
525	12	4	11:00	11:30	t
526	12	4	11:30	12:00	t
527	12	4	15:30	16:00	t
528	12	4	14:30	15:00	t
529	12	5	10:00	10:30	t
530	12	5	13:30	14:00	t
531	12	5	14:00	14:30	t
532	12	5	10:30	11:00	t
533	12	5	15:00	15:30	t
534	12	5	09:30	10:00	t
535	12	5	16:30	17:00	t
536	12	5	11:00	11:30	t
537	12	5	13:00	13:30	t
538	12	5	14:30	15:00	t
539	13	1	10:00	10:30	t
540	13	1	09:00	09:30	t
541	13	1	11:30	12:00	t
542	13	1	13:00	13:30	t
543	13	1	14:30	15:00	t
544	13	1	16:00	16:30	t
545	13	1	16:30	17:00	t
546	13	2	09:00	09:30	t
547	13	2	09:30	10:00	t
548	13	2	16:30	17:00	t
549	13	2	10:00	10:30	t
550	13	2	15:30	16:00	t
551	13	2	16:00	16:30	t
552	13	2	14:30	15:00	t
553	13	2	13:00	13:30	t
554	13	2	11:30	12:00	t
555	13	3	11:30	12:00	t
556	13	3	11:00	11:30	t
557	13	3	16:00	16:30	t
558	13	3	13:30	14:00	t
559	13	3	14:30	15:00	t
560	13	3	10:30	11:00	t
561	13	3	15:00	15:30	t
562	13	3	16:30	17:00	t
563	13	3	09:00	09:30	t
564	13	3	13:00	13:30	t
565	13	4	13:30	14:00	t
566	13	4	13:00	13:30	t
567	13	4	11:30	12:00	t
568	13	4	15:30	16:00	t
569	13	4	09:00	09:30	t
570	13	4	16:00	16:30	t
571	13	4	15:00	15:30	t
572	13	4	16:30	17:00	t
573	13	4	09:30	10:00	t
574	13	5	11:30	12:00	t
575	13	5	13:00	13:30	t
576	13	5	10:30	11:00	t
577	13	5	13:30	14:00	t
578	13	5	15:00	15:30	t
579	13	5	10:00	10:30	t
580	13	5	09:30	10:00	t
581	13	5	16:30	17:00	t
582	14	1	10:30	11:00	t
583	14	1	13:30	14:00	t
584	14	1	09:00	09:30	t
585	14	1	11:00	11:30	t
586	14	1	09:30	10:00	t
587	14	1	15:00	15:30	t
588	14	1	16:30	17:00	t
589	14	1	14:00	14:30	t
590	14	1	10:00	10:30	t
591	14	1	15:30	16:00	t
592	14	2	13:30	14:00	t
593	14	2	16:30	17:00	t
594	14	2	10:00	10:30	t
595	14	2	09:30	10:00	t
596	14	2	11:30	12:00	t
597	14	2	11:00	11:30	t
598	14	2	15:00	15:30	t
599	14	2	10:30	11:00	t
600	14	2	09:00	09:30	t
601	14	2	15:30	16:00	t
602	14	3	16:00	16:30	t
603	14	3	15:00	15:30	t
604	14	3	09:00	09:30	t
605	14	3	15:30	16:00	t
606	14	3	16:30	17:00	t
607	14	3	09:30	10:00	t
608	14	3	13:00	13:30	t
609	14	4	10:00	10:30	t
610	14	4	09:00	09:30	t
611	14	4	16:00	16:30	t
612	14	4	13:00	13:30	t
613	14	4	15:00	15:30	t
614	14	4	11:30	12:00	t
615	14	4	09:30	10:00	t
616	14	5	16:00	16:30	t
617	14	5	10:30	11:00	t
618	14	5	16:30	17:00	t
619	14	5	13:00	13:30	t
620	14	5	13:30	14:00	t
621	14	5	09:30	10:00	t
622	14	5	11:00	11:30	t
623	14	5	10:00	10:30	t
624	14	5	14:00	14:30	t
625	14	5	15:30	16:00	t
626	15	1	16:00	16:30	t
627	15	1	14:00	14:30	t
628	15	1	11:30	12:00	t
629	15	1	09:00	09:30	t
630	15	1	13:30	14:00	t
631	15	1	09:30	10:00	t
632	15	1	10:00	10:30	t
633	15	1	11:00	11:30	t
634	15	1	16:30	17:00	t
635	15	2	10:30	11:00	t
636	15	2	10:00	10:30	t
637	15	2	16:30	17:00	t
638	15	2	09:30	10:00	t
639	15	2	11:00	11:30	t
640	15	2	13:00	13:30	t
641	15	2	15:30	16:00	t
642	15	2	14:00	14:30	t
643	15	3	13:00	13:30	t
644	15	3	10:30	11:00	t
645	15	3	10:00	10:30	t
646	15	3	15:30	16:00	t
647	15	3	11:30	12:00	t
648	15	3	11:00	11:30	t
649	15	3	16:30	17:00	t
650	15	3	16:00	16:30	t
651	15	4	16:00	16:30	t
652	15	4	11:00	11:30	t
653	15	4	10:30	11:00	t
654	15	4	15:30	16:00	t
655	15	4	14:30	15:00	t
656	15	4	15:00	15:30	t
657	15	4	14:00	14:30	t
658	15	4	09:30	10:00	t
659	15	4	16:30	17:00	t
660	15	4	13:30	14:00	t
661	15	5	16:00	16:30	t
662	15	5	14:30	15:00	t
663	15	5	11:00	11:30	t
664	15	5	15:30	16:00	t
665	15	5	10:30	11:00	t
666	15	5	09:30	10:00	t
667	15	5	16:30	17:00	t
668	15	5	13:00	13:30	t
669	15	5	11:30	12:00	t
670	15	5	13:30	14:00	t
671	16	1	10:30	11:00	t
672	16	1	10:00	10:30	t
673	16	1	11:30	12:00	t
674	16	1	15:00	15:30	t
675	16	1	16:00	16:30	t
676	16	1	13:00	13:30	t
677	16	1	16:30	17:00	t
678	16	2	11:30	12:00	t
679	16	2	09:00	09:30	t
680	16	2	09:30	10:00	t
681	16	2	15:30	16:00	t
682	16	2	15:00	15:30	t
683	16	2	10:30	11:00	t
684	16	2	13:00	13:30	t
685	16	2	11:00	11:30	t
686	16	3	13:00	13:30	t
687	16	3	09:00	09:30	t
688	16	3	14:30	15:00	t
689	16	3	09:30	10:00	t
690	16	3	13:30	14:00	t
691	16	3	16:30	17:00	t
692	16	3	10:30	11:00	t
693	16	3	16:00	16:30	t
694	16	3	11:00	11:30	t
695	16	3	11:30	12:00	t
696	16	4	14:30	15:00	t
697	16	4	15:30	16:00	t
698	16	4	11:30	12:00	t
699	16	4	16:00	16:30	t
700	16	4	11:00	11:30	t
701	16	4	10:30	11:00	t
702	16	4	15:00	15:30	t
703	16	5	11:30	12:00	t
704	16	5	14:00	14:30	t
705	16	5	09:30	10:00	t
706	16	5	16:30	17:00	t
707	16	5	09:00	09:30	t
708	16	5	13:00	13:30	t
709	16	5	15:30	16:00	t
710	17	1	10:30	11:00	t
711	17	1	09:30	10:00	t
712	17	1	11:00	11:30	t
713	17	1	13:30	14:00	t
714	17	1	10:00	10:30	t
715	17	1	14:00	14:30	t
716	17	1	16:00	16:30	t
717	17	1	09:00	09:30	t
718	17	2	09:00	09:30	t
719	17	2	09:30	10:00	t
720	17	2	10:00	10:30	t
721	17	2	14:30	15:00	t
722	17	2	13:30	14:00	t
723	17	2	15:30	16:00	t
724	17	2	10:30	11:00	t
725	17	2	11:30	12:00	t
726	17	3	11:00	11:30	t
727	17	3	13:30	14:00	t
728	17	3	09:00	09:30	t
729	17	3	10:30	11:00	t
730	17	3	15:00	15:30	t
731	17	3	15:30	16:00	t
732	17	3	09:30	10:00	t
733	17	3	14:00	14:30	t
734	17	3	11:30	12:00	t
735	17	4	11:30	12:00	t
736	17	4	10:30	11:00	t
737	17	4	15:00	15:30	t
738	17	4	10:00	10:30	t
739	17	4	13:30	14:00	t
740	17	4	13:00	13:30	t
741	17	4	09:30	10:00	t
742	17	4	14:30	15:00	t
743	17	4	14:00	14:30	t
744	17	5	16:00	16:30	t
745	17	5	13:00	13:30	t
746	17	5	15:00	15:30	t
747	17	5	09:00	09:30	t
748	17	5	11:30	12:00	t
749	17	5	10:30	11:00	t
750	17	5	11:00	11:30	t
751	18	1	13:00	13:30	t
752	18	1	10:30	11:00	t
753	18	1	16:00	16:30	t
754	18	1	15:00	15:30	t
755	18	1	09:00	09:30	t
756	18	1	14:30	15:00	t
757	18	1	14:00	14:30	t
758	18	1	09:30	10:00	t
759	18	1	11:30	12:00	t
760	18	2	11:30	12:00	t
761	18	2	09:00	09:30	t
762	18	2	13:00	13:30	t
763	18	2	11:00	11:30	t
764	18	2	09:30	10:00	t
765	18	2	16:00	16:30	t
766	18	2	14:00	14:30	t
767	18	2	10:30	11:00	t
768	18	2	10:00	10:30	t
769	18	3	09:30	10:00	t
770	18	3	09:00	09:30	t
771	18	3	16:00	16:30	t
772	18	3	14:00	14:30	t
773	18	3	11:30	12:00	t
774	18	3	10:30	11:00	t
775	18	3	15:30	16:00	t
776	18	4	09:00	09:30	t
777	18	4	16:30	17:00	t
778	18	4	09:30	10:00	t
779	18	4	13:30	14:00	t
780	18	4	15:00	15:30	t
781	18	4	13:00	13:30	t
782	18	4	11:30	12:00	t
783	18	5	09:30	10:00	t
784	18	5	10:30	11:00	t
785	18	5	16:00	16:30	t
786	18	5	11:30	12:00	t
787	18	5	11:00	11:30	t
788	18	5	10:00	10:30	t
789	18	5	16:30	17:00	t
790	18	5	13:30	14:00	t
791	18	5	14:00	14:30	t
792	18	5	15:00	15:30	t
793	19	1	11:00	11:30	t
794	19	1	13:30	14:00	t
795	19	1	11:30	12:00	t
796	19	1	16:30	17:00	t
797	19	1	16:00	16:30	t
798	19	1	10:00	10:30	t
799	19	1	09:30	10:00	t
800	19	1	14:00	14:30	t
801	19	2	13:30	14:00	t
802	19	2	11:00	11:30	t
803	19	2	10:00	10:30	t
804	19	2	16:00	16:30	t
805	19	2	14:00	14:30	t
806	19	2	15:30	16:00	t
807	19	2	11:30	12:00	t
808	19	3	15:00	15:30	t
809	19	3	10:30	11:00	t
810	19	3	13:00	13:30	t
811	19	3	09:00	09:30	t
812	19	3	13:30	14:00	t
813	19	3	09:30	10:00	t
814	19	3	16:00	16:30	t
815	19	3	11:30	12:00	t
816	19	4	09:00	09:30	t
817	19	4	13:30	14:00	t
818	19	4	09:30	10:00	t
819	19	4	16:00	16:30	t
820	19	4	14:00	14:30	t
821	19	4	11:30	12:00	t
822	19	4	10:30	11:00	t
823	19	4	10:00	10:30	t
824	19	4	16:30	17:00	t
825	19	5	10:30	11:00	t
826	19	5	13:00	13:30	t
827	19	5	16:00	16:30	t
828	19	5	14:00	14:30	t
829	19	5	15:00	15:30	t
830	19	5	09:00	09:30	t
831	19	5	13:30	14:00	t
832	19	5	09:30	10:00	t
833	19	5	15:30	16:00	t
834	20	1	09:30	10:00	t
835	20	1	16:30	17:00	t
836	20	1	11:30	12:00	t
837	20	1	14:30	15:00	t
838	20	1	10:00	10:30	t
839	20	1	16:00	16:30	t
840	20	1	09:00	09:30	t
841	20	1	14:00	14:30	t
842	20	1	13:00	13:30	t
843	20	1	13:30	14:00	t
844	20	2	14:30	15:00	t
845	20	2	10:30	11:00	t
846	20	2	16:30	17:00	t
847	20	2	09:30	10:00	t
848	20	2	09:00	09:30	t
849	20	2	10:00	10:30	t
850	20	2	15:30	16:00	t
851	20	2	14:00	14:30	t
852	20	2	11:30	12:00	t
853	20	2	11:00	11:30	t
854	20	3	10:30	11:00	t
855	20	3	10:00	10:30	t
856	20	3	13:00	13:30	t
857	20	3	14:30	15:00	t
858	20	3	14:00	14:30	t
859	20	3	09:00	09:30	t
860	20	3	11:30	12:00	t
861	20	4	09:00	09:30	t
862	20	4	16:30	17:00	t
863	20	4	13:00	13:30	t
864	20	4	13:30	14:00	t
865	20	4	11:00	11:30	t
866	20	4	14:30	15:00	t
867	20	4	09:30	10:00	t
868	20	4	10:00	10:30	t
869	20	4	14:00	14:30	t
870	20	5	11:00	11:30	t
871	20	5	09:00	09:30	t
872	20	5	14:30	15:00	t
873	20	5	14:00	14:30	t
874	20	5	11:30	12:00	t
875	20	5	15:00	15:30	t
876	20	5	09:30	10:00	t
877	20	5	16:00	16:30	t
878	20	5	10:00	10:30	t
879	21	1	15:00	15:30	t
880	21	1	09:00	09:30	t
881	21	1	09:30	10:00	t
882	21	1	15:30	16:00	t
883	21	1	13:00	13:30	t
884	21	1	14:30	15:00	t
885	21	1	10:00	10:30	t
886	21	1	10:30	11:00	t
887	21	1	11:00	11:30	t
888	21	1	16:00	16:30	t
889	21	1	14:00	14:30	t
890	21	2	11:00	11:30	t
891	21	2	10:30	11:00	t
892	21	2	11:30	12:00	t
893	21	2	14:30	15:00	t
894	21	2	13:30	14:00	t
895	21	2	16:30	17:00	t
896	21	2	15:00	15:30	t
897	21	2	16:00	16:30	t
898	21	2	10:00	10:30	t
899	21	2	14:00	14:30	t
900	21	3	15:30	16:00	t
901	21	3	13:00	13:30	t
902	21	3	13:30	14:00	t
903	21	3	10:00	10:30	t
904	21	3	16:30	17:00	t
905	21	3	15:00	15:30	t
906	21	3	09:30	10:00	t
907	21	3	11:00	11:30	t
908	21	3	10:30	11:00	t
909	21	4	13:30	14:00	t
910	21	4	09:00	09:30	t
911	21	4	16:30	17:00	t
912	21	4	16:00	16:30	t
913	21	4	15:30	16:00	t
914	21	4	13:00	13:30	t
915	21	4	15:00	15:30	t
916	21	4	14:30	15:00	t
917	21	4	10:00	10:30	t
918	21	5	13:30	14:00	t
919	21	5	16:30	17:00	t
920	21	5	11:30	12:00	t
921	21	5	11:00	11:30	t
922	21	5	09:00	09:30	t
923	21	5	09:30	10:00	t
924	21	5	10:00	10:30	t
925	21	5	16:00	16:30	t
926	21	5	14:30	15:00	t
927	22	1	09:00	09:30	t
928	22	1	11:00	11:30	t
929	22	1	16:00	16:30	t
930	22	1	09:30	10:00	t
931	22	1	13:00	13:30	t
932	22	1	10:00	10:30	t
933	22	1	14:30	15:00	t
934	22	1	15:00	15:30	t
935	22	1	14:00	14:30	t
936	22	2	14:00	14:30	t
937	22	2	16:30	17:00	t
938	22	2	09:30	10:00	t
939	22	2	16:00	16:30	t
940	22	2	09:00	09:30	t
941	22	2	14:30	15:00	t
942	22	2	10:00	10:30	t
943	22	3	14:30	15:00	t
944	22	3	14:00	14:30	t
945	22	3	13:30	14:00	t
946	22	3	13:00	13:30	t
947	22	3	11:30	12:00	t
948	22	3	15:30	16:00	t
949	22	3	11:00	11:30	t
950	22	4	16:30	17:00	t
951	22	4	13:30	14:00	t
952	22	4	14:00	14:30	t
953	22	4	09:30	10:00	t
954	22	4	09:00	09:30	t
955	22	4	10:00	10:30	t
956	22	4	15:30	16:00	t
957	22	4	11:00	11:30	t
958	22	4	14:30	15:00	t
959	22	4	10:30	11:00	t
960	22	5	09:30	10:00	t
961	22	5	11:00	11:30	t
962	22	5	15:30	16:00	t
963	22	5	15:00	15:30	t
964	22	5	13:30	14:00	t
965	22	5	11:30	12:00	t
966	22	5	10:30	11:00	t
967	22	5	16:30	17:00	t
968	23	1	16:00	16:30	t
969	23	1	15:00	15:30	t
970	23	1	15:30	16:00	t
971	23	1	13:30	14:00	t
972	23	1	14:00	14:30	t
973	23	1	09:00	09:30	t
974	23	1	13:00	13:30	t
975	23	1	09:30	10:00	t
976	23	1	10:00	10:30	t
977	23	1	10:30	11:00	t
978	23	2	11:30	12:00	t
979	23	2	11:00	11:30	t
980	23	2	15:30	16:00	t
981	23	2	16:30	17:00	t
982	23	2	09:30	10:00	t
983	23	2	14:00	14:30	t
984	23	2	09:00	09:30	t
985	23	2	15:00	15:30	t
986	23	3	15:30	16:00	t
987	23	3	11:30	12:00	t
988	23	3	10:00	10:30	t
989	23	3	10:30	11:00	t
990	23	3	11:00	11:30	t
991	23	3	13:30	14:00	t
992	23	3	15:00	15:30	t
993	23	3	14:00	14:30	t
994	23	3	09:30	10:00	t
995	23	3	16:30	17:00	t
996	23	4	10:30	11:00	t
997	23	4	10:00	10:30	t
998	23	4	15:30	16:00	t
999	23	4	14:30	15:00	t
1000	23	4	11:30	12:00	t
1001	23	4	13:30	14:00	t
1002	23	4	16:30	17:00	t
1003	23	5	11:00	11:30	t
1004	23	5	14:00	14:30	t
1005	23	5	14:30	15:00	t
1006	23	5	15:00	15:30	t
1007	23	5	10:30	11:00	t
1008	23	5	13:00	13:30	t
1009	23	5	11:30	12:00	t
1010	23	5	15:30	16:00	t
1011	23	5	16:30	17:00	t
1012	24	1	14:00	14:30	t
1013	24	1	13:00	13:30	t
1014	24	1	15:00	15:30	t
1015	24	1	10:30	11:00	t
1016	24	1	15:30	16:00	t
1017	24	1	10:00	10:30	t
1018	24	1	14:30	15:00	t
1019	24	1	09:30	10:00	t
1020	24	2	16:00	16:30	t
1021	24	2	09:00	09:30	t
1022	24	2	09:30	10:00	t
1023	24	2	15:30	16:00	t
1024	24	2	10:00	10:30	t
1025	24	2	10:30	11:00	t
1026	24	2	16:30	17:00	t
1027	24	2	14:00	14:30	t
1028	24	2	11:30	12:00	t
1029	24	3	15:30	16:00	t
1030	24	3	11:30	12:00	t
1031	24	3	11:00	11:30	t
1032	24	3	10:00	10:30	t
1033	24	3	14:00	14:30	t
1034	24	3	13:30	14:00	t
1035	24	3	16:30	17:00	t
1036	24	3	15:00	15:30	t
1037	24	3	09:30	10:00	t
1038	24	4	13:30	14:00	t
1039	24	4	13:00	13:30	t
1040	24	4	11:30	12:00	t
1041	24	4	14:30	15:00	t
1042	24	4	11:00	11:30	t
1043	24	4	15:30	16:00	t
1044	24	4	10:30	11:00	t
1045	24	4	10:00	10:30	t
1046	24	4	09:30	10:00	t
1047	24	5	09:00	09:30	t
1048	24	5	13:00	13:30	t
1049	24	5	13:30	14:00	t
1050	24	5	14:00	14:30	t
1051	24	5	16:00	16:30	t
1052	24	5	09:30	10:00	t
1053	24	5	10:00	10:30	t
1054	24	5	15:00	15:30	t
1055	24	5	10:30	11:00	t
1056	24	5	11:00	11:30	t
1057	25	1	16:00	16:30	t
1058	25	1	13:00	13:30	t
1059	25	1	11:00	11:30	t
1060	25	1	16:30	17:00	t
1061	25	1	15:00	15:30	t
1062	25	1	13:30	14:00	t
1063	25	1	10:30	11:00	t
1064	25	1	10:00	10:30	t
1065	25	2	13:00	13:30	t
1066	25	2	16:30	17:00	t
1067	25	2	14:00	14:30	t
1068	25	2	13:30	14:00	t
1069	25	2	15:00	15:30	t
1070	25	2	10:30	11:00	t
1071	25	2	09:00	09:30	t
1072	25	2	09:30	10:00	t
1073	25	3	16:00	16:30	t
1074	25	3	15:30	16:00	t
1075	25	3	15:00	15:30	t
1076	25	3	16:30	17:00	t
1077	25	3	14:30	15:00	t
1078	25	3	14:00	14:30	t
1079	25	3	13:30	14:00	t
1080	25	3	13:00	13:30	t
1081	25	3	11:30	12:00	t
1082	25	4	10:00	10:30	t
1083	25	4	09:00	09:30	t
1084	25	4	15:30	16:00	t
1085	25	4	16:30	17:00	t
1086	25	4	13:00	13:30	t
1087	25	4	09:30	10:00	t
1088	25	4	14:30	15:00	t
1089	25	4	15:00	15:30	t
1090	25	5	10:30	11:00	t
1091	25	5	15:00	15:30	t
1092	25	5	14:30	15:00	t
1093	25	5	13:30	14:00	t
1094	25	5	10:00	10:30	t
1095	25	5	14:00	14:30	t
1096	25	5	15:30	16:00	t
\.


--
-- Data for Name: doctor_symptoms; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.doctor_symptoms (id, doctor_id, symptom_id, expertise) FROM stdin;
1	1	3	5
2	1	2	5
3	1	1	4
4	1	4	5
5	1	5	4
6	1	6	3
7	1	7	3
8	1	8	3
9	1	9	4
10	1	10	1
11	2	3	4
12	2	2	4
13	2	1	4
14	2	4	4
15	2	5	4
16	2	6	3
17	2	7	3
18	2	8	3
19	2	9	3
20	2	10	2
21	3	3	4
22	3	2	5
23	3	1	4
24	3	4	4
25	3	5	5
26	3	6	4
27	3	8	4
28	3	9	4
29	3	10	4
30	3	7	1
31	4	3	5
32	4	2	5
33	4	1	4
34	4	4	4
35	4	5	4
36	4	6	3
37	4	8	4
38	4	9	4
39	4	10	3
40	4	7	2
41	5	3	4
42	5	2	5
43	5	1	4
44	5	4	5
45	5	5	5
46	5	10	3
47	5	9	2
48	5	8	1
49	6	2	5
50	6	7	5
51	6	1	1
52	6	3	1
53	7	6	5
54	7	7	3
55	7	10	1
56	8	1	5
57	8	9	5
58	8	10	4
59	8	2	1
60	8	8	1
61	9	4	5
62	9	9	3
63	9	10	2
64	9	1	2
65	9	6	1
66	10	1	1
67	11	8	2
68	11	7	2
69	12	6	2
70	13	10	5
71	13	2	2
72	13	9	1
73	14	1	1
74	15	1	1
75	15	6	1
76	15	7	2
77	16	5	1
78	16	4	2
79	17	5	4
80	17	9	1
81	17	7	1
82	18	8	5
83	18	1	2
84	18	4	1
85	19	1	1
86	19	5	2
87	20	10	3
88	20	1	1
89	21	5	1
90	22	7	1
91	23	4	1
92	23	2	2
93	24	6	5
94	24	7	3
95	24	3	1
96	25	1	5
97	25	9	5
98	25	10	3
99	25	6	1
100	25	8	1
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.doctors (id, user_id, specialty, experience, hospital_affiliation, education, license_number, accepting_new_patients, about, profile_picture, rating, review_count) FROM stdin;
1	1	Internal Medicine	16	Bir Hospital	Tribhuvan University Institute of Medicine	MD488743	t	Dr. Bajracharya is a board-certified internal medicine specialist with over 16 years of experience.	\N	5	120
2	2	Internal Medicine	12	Patan Hospital	Kathmandu University School of Medical Sciences	MD575428	t	Dr. Gurung is a board-certified internal medicine specialist with over 12 years of experience.	\N	5	120
3	3	Family Medicine	9	Nepal Medical College and Teaching Hospital	Nepal Medical College	MD838699	t	Dr. Prajapati is a board-certified family medicine specialist with over 9 years of experience.	\N	5	120
4	4	Family Medicine	11	KIST Medical College and Teaching Hospital	KIST Medical College	MD211400	t	Dr. Bhandari is a board-certified family medicine specialist with over 11 years of experience.	\N	5	120
5	5	General Practice	8	Kathmandu Model Hospital	Patan Academy of Health Sciences	MD604187	t	Dr. Thapa is a board-certified general practice specialist with over 8 years of experience.	\N	5	120
6	6	Pulmonology	9	Patan Hospital	Nobel Medical College	MD106306	t	Dr. Tamang is a board-certified pulmonology specialist with over 9 years of experience.	\N	5	120
7	7	Cardiology	12	Norvic International Hospital	Tribhuvan University Institute of Medicine	MD390630	t	Dr. Sharma is a board-certified cardiology specialist with over 12 years of experience.	\N	5	120
8	8	Neurology	8	Grande International Hospital	Kathmandu Medical College	MD648966	t	Dr. Thapa is a board-certified neurology specialist with over 8 years of experience.	\N	5	120
9	9	ENT	14	Nepal Eye Hospital	Patan Academy of Health Sciences	MD380011	t	Dr. Chhetri is a board-certified ent specialist with over 14 years of experience.	\N	5	120
10	10	Dermatology	15	HAMS Hospital	BP Koirala Institute of Health Sciences	MD108901	t	Dr. Poudel is a board-certified dermatology specialist with over 15 years of experience.	\N	5	120
11	11	Dermatology	7	Om Hospital & Research Center	Nepal Medical College	MD752246	t	Dr. Lama is a board-certified dermatology specialist with over 7 years of experience.	\N	5	120
12	12	Pediatrics	10	Kanti Children's Hospital	Nepal Medical College	MD991907	t	Dr. Adhikari is a board-certified pediatrics specialist with over 10 years of experience.	\N	5	120
13	13	Orthopedics	14	B&B Hospital	Manipal College of Medical Sciences	MD240160	t	Dr. KC is a board-certified orthopedics specialist with over 14 years of experience.	\N	5	120
14	14	Gynecology	9	Paropakar Maternity Hospital	KIST Medical College	MD989556	t	Dr. Shrestha is a board-certified gynecology specialist with over 9 years of experience.	\N	5	120
15	15	Ophthalmology	11	Tilganga Institute of Ophthalmology	Tribhuvan University Institute of Medicine	MD523227	t	Dr. Gurung is a board-certified ophthalmology specialist with over 11 years of experience.	\N	5	120
16	16	Psychiatry	7	Mental Hospital, Lagankhel	Patan Academy of Health Sciences	MD200776	t	Dr. Rai is a board-certified psychiatry specialist with over 7 years of experience.	\N	5	120
17	17	Endocrinology	13	Medicare National Hospital	Universal College of Medical Sciences	MD441552	t	Dr. Basnet is a board-certified endocrinology specialist with over 13 years of experience.	\N	5	120
18	18	Gastroenterology	10	Civil Service Hospital	Kathmandu University School of Medical Sciences	MD202839	t	Dr. Maharjan is a board-certified gastroenterology specialist with over 10 years of experience.	\N	5	120
19	19	Urology	12	Nepal Mediciti Hospital	Tribhuvan University Institute of Medicine	MD927809	t	Dr. Karki is a board-certified urology specialist with over 12 years of experience.	\N	5	120
20	20	Rheumatology	8	Star Hospital	Manipal College of Medical Sciences	MD578979	t	Dr. Neupane is a board-certified rheumatology specialist with over 8 years of experience.	\N	5	120
21	21	Nephrology	11	National Kidney Center	BP Koirala Institute of Health Sciences	MD785743	t	Dr. Bhattarai is a board-certified nephrology specialist with over 11 years of experience.	\N	5	120
22	22	Hematology	10	Bhaktapur Cancer Hospital	Kathmandu Medical College	MD581394	t	Dr. Magar is a board-certified hematology specialist with over 10 years of experience.	\N	5	120
23	23	Oncology	15	Nepal Cancer Hospital	Tribhuvan University Institute of Medicine	MD424302	t	Dr. Acharya is a board-certified oncology specialist with over 15 years of experience.	\N	5	120
24	24	Cardiology	13	Shahid Gangalal National Heart Centre	Kathmandu University School of Medical Sciences	MD659768	t	Dr. Dahal is a board-certified cardiology specialist with over 13 years of experience.	\N	5	120
25	25	Neurology	9	Grande International Hospital	KIST Medical College	MD586025	t	Dr. Pandey is a board-certified neurology specialist with over 9 years of experience.	\N	5	120
\.


--
-- Data for Name: health_records; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.health_records (id, patient_id, record_type, name, details, date, is_active) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.patients (id, user_id, date_of_birth, gender, phone, address, city, state, zip_code, insurance_provider, insurance_policy_number, blood_type, profile_picture) FROM stdin;
1	26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.reminders (id, patient_id, title, description, date, is_completed, type) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.session (sid, sess, expire) FROM stdin;
6R-M8tlGivG1F5z9FOGXNpWvVTj6olDU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-11T11:49:44.812Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":26}}	2025-07-11 11:49:45
\.


--
-- Data for Name: specialties; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.specialties (id, name, description, category) FROM stdin;
\.


--
-- Data for Name: symptoms; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.symptoms (id, name, description, body_part, severity) FROM stdin;
1	Headache	Pain in the head or upper neck	Head	moderate
2	Cough	Sudden expulsion of air from the lungs	Chest	mild
3	Fever	Body temperature above the normal range	Whole body	moderate
4	Sore Throat	Pain or irritation in the throat	Throat	mild
5	Fatigue	Feeling of tiredness or exhaustion	Whole body	moderate
6	Chest Pain	Pain or discomfort in the chest	Chest	severe
7	Shortness of Breath	Difficulty breathing or catching breath	Chest	severe
8	Nausea	Feeling of sickness with an inclination to vomit	Stomach	moderate
9	Dizziness	Feeling lightheaded or unsteady	Head	moderate
10	Back Pain	Pain in the back	Back	moderate
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: medimatch
--

COPY public.users (id, email, password, first_name, last_name, user_type, created_at) FROM stdin;
1	pradeep.bajracharya@example.com	68bb33c2de9729c5d51e73ad69c1ad0a2bdc8fd681014f0653da4a0e9007d3a79e6fec2fea678acfd2bcb0d51a0a8ffb424e0e69ec5781520d44d6fd9e2addb6.a150945107d317cd0491a99538a86aee	Pradeep	Bajracharya	doctor	2025-07-04 11:33:45.134184
2	anita.gurung@example.com	c44fbb54dadc0542c8a5e63fe88492b22b64b80ca9a518f73cdf8ccb15375127fe15f213d44b1850f2e2ef717adc64e19536d75333e04acc06bb34e4ece2b149.a53518e68e13522ba5f278959b8d095a	Anita	Gurung	doctor	2025-07-04 11:33:45.182163
3	suresh.prajapati@example.com	fbfea73ed8d552578aaeb02f16229473a85928e4bd0b6b8174ce6fc199833fde1505a5765c121aa072b64114f5eab48c876e7723266c925cfc47588c69089d1d.dfef414c2c2c49ddca8ced5ecea1a626	Suresh	Prajapati	doctor	2025-07-04 11:33:45.227777
4	kabita.bhandari@example.com	70a2feeca7f88665be07ccb552f25024e0bd0c64aa4980439b91d288d569fa765260ac0ecdf9cf60e36d7a469e33f9746f25ed5025d473f1d2e4965a9a7707eb.ecbe902d03a6665929474143a1787be1	Kabita	Bhandari	doctor	2025-07-04 11:33:45.275148
5	roshan.thapa@example.com	e44c2f4d2e5658470751ec548e40513a6d1c39af105041b219d3d8cffd4bc87d5eaff6633db6a005df3c606e711e6e92eebc731c62f22939f77b8da2417f2597.592620fe546eb743bbe6c30c7c35c6d4	Roshan	Thapa	doctor	2025-07-04 11:33:45.322056
6	sabina.tamang@example.com	6605848fb59b2b4c7cb15d9243f8f6a7f661dc72fb0eea157b10bc9c09edf291a64867282a18850c02ef48b28e062443c296c8224adb302ff30a45fe5609ad11.14d1f7f7cc16bf3cffec6dda63eb73a8	Sabina	Tamang	doctor	2025-07-04 11:33:45.368444
7	aarav.sharma@example.com	659d37d221537d19eef85a77bdf1b63ce2411f0f699cb67551afbfaf797ec463b0d5f0057a3101480d1f21de3829aa88eaeb2b92fae6bce0c450d829f1ff59db.1a2571f6078cfbc8262b4d901ddaeb24	Aarav	Sharma	doctor	2025-07-04 11:33:45.414617
8	nisha.thapa@example.com	755c5b4c15ba93344ff4f8382e2d1348d2052c32eff6e97cb7ad7bbff8025e69cced88847077e965e44629adcc0b55f8d708980cea02697dcb867539d55adad6.5c284cc4cbc19444cf0d61948b1391cc	Nisha	Thapa	doctor	2025-07-04 11:33:45.466677
9	ramesh.chhetri@example.com	87a059d35661e68b2b133ac8a42776676531f8863256c5c21a7a684e6633cef03cce640257982999667e1a01b9d7768fbda289095c7b8544879c2e3efcc6fd79.cc48e5381c620434134f29930fb6a2f0	Ramesh	Chhetri	doctor	2025-07-04 11:33:45.51126
10	rajesh.poudel@example.com	5fe4798bf3f12fc9641cb6dd80fad98d8e441d66e09111359df44699ff94d0d4691536f3894d99167e364b42ae2cabb4d6b199787c57a9585159b08f65faf464.c2862cf130a19b25b8358d6c310b3b39	Rajesh	Poudel	doctor	2025-07-04 11:33:45.556531
11	gita.lama@example.com	d9140717ec44afcff52efecaae38358a15c580dc61cde631351870cd4043d4290e64602b3f480243ff1be627e54438f39cb7f910ff9eed891418aa83efd70501.3a44201f5eba94e41ae925b305ba1dcc	Gita	Lama	doctor	2025-07-04 11:33:45.602433
12	sarita.adhikari@example.com	0b255bdd1571982fe8162ab15c1c27c6ace32918fdc06166e22479256c515245a874614f438290ee0e14d0a8f310137047792d1b00eb783e7ea97240e1bc920d.dd94091a13ffd40fea5c51e5fca7ec4c	Sarita	Adhikari	doctor	2025-07-04 11:33:45.647572
13	dipak.kc@example.com	a38c84fef6fefe13d2d98c02bd2695f244c9f0762e030e2d8f49b5c8334c549c07bcabfdf7ac9712277998d2f7b3484c4ac7abd12d1bcee7affe2d0025c2f53d.be28cf37028c8d120a512b4e57d050e0	Dipak	KC	doctor	2025-07-04 11:33:45.692003
14	anjali.shrestha@example.com	ef9d0cf79c79db2743658253e6a7e875ed5472fc734470ec5e25042c0b8d442fe92d18b083e685244c0870d06e17eb6cb151db16502b364d81c43fbdb9a5d3b3.932b0e208069531e5a288139ceee3ce2	Anjali	Shrestha	doctor	2025-07-04 11:33:45.737359
15	prakash.gurung@example.com	7f2d47eeba09d53564eda1fa0b0e0b0e3d9baa138a21c09c869194623990c21b3fb20b645bce74abf5224c8a9d2d81f0b33d8a0e59fa8b0ec1af544c5f056d51.4580831b8719af8b46d5936043c45f20	Prakash	Gurung	doctor	2025-07-04 11:33:45.780801
16	suman.rai@example.com	acd76807d5c6672670b46edff3ed8cadd6e4305f6d6411d666ec0d32f12dcd36c04fab6ee3984a4e0d072910f5a2d7edc059371a1c3b6a4be45ea9b42c8c32da.51ae8d0d7e5791290f3fb91227312abc	Suman	Rai	doctor	2025-07-04 11:33:45.822515
17	mamata.basnet@example.com	063189979678004c61d1dc8a16767384efe637fea044c66e536c3e53485d986b23ebbcbca6c46354a31c400e40d87f3daa17b69989ce748d82dbe4b7b7e10490.9358e9ca265aeb355c924c0db731febb	Mamata	Basnet	doctor	2025-07-04 11:33:45.865551
18	bikash.maharjan@example.com	74ec76a4b963dc622e85a27ffc5b118b46422e7da0c582e6cd494924ba2f5e62becc6ae5824b5ed43bb8bb17965a4f6744f65c09b8dc45d0ce188d4a4d387621.05dae228f6711bfa5719bc82a49fe00e	Bikash	Maharjan	doctor	2025-07-04 11:33:45.908794
19	nabin.karki@example.com	448cb827c050bc1d18c8f33cdcfaaa581226dc5cc9b4fc0b5344f6c2ea82fad7466e4b1727455b634e4a2b89ab13b4709e2aa51ecd22852db17d83c7e34c151a.fd18e3f2d6a81af5bb5d2105909f49c9	Nabin	Karki	doctor	2025-07-04 11:33:45.952503
20	sunita.neupane@example.com	f17b569a1f49663c1f754f768b45cc7ba7fe5b99926e54e7728ac06d2f13ee5dec99d135a40e167322988e3b0c6bcde6a0a2c4197bb3b3e78c26216512fc1abb.15173a784557fd8e5d2cb74a5fbe39a5	Sunita	Neupane	doctor	2025-07-04 11:33:45.996002
21	deepak.bhattarai@example.com	393e8d62045add4a27f3b37a194dbdc1207ea6d3d03ab21b3d37510061f8f6db5a82465cbc897a62b07d01bee9eb261e9372c9d727bb2d9cae507ffff6a0c250.fc2bb8ea565b32ad27e845e4f6e9369a	Deepak	Bhattarai	doctor	2025-07-04 11:33:46.038705
22	ranju.magar@example.com	391659caf396c990a2a33835f3b93987018d42825897219e4618830183d3d2b912044fb4784fb8b8c3dd973e22dd9f193fbf4464849ef5169ef0f3f24e893298.b9be0be418eea47e90ae965eb3b92c37	Ranju	Magar	doctor	2025-07-04 11:33:46.082974
23	kamal.acharya@example.com	926fed1e3966dcd0183cc53a5495cb56191ba48206a888b8fd78913a3ba91ec4ad8168a3fa2a50a9f0162fa79755560bac22234ee763245220b02ae3f18d872b.1b067dc31c7b2211f20a044e0fdc624a	Kamal	Acharya	doctor	2025-07-04 11:33:46.12659
24	binod.dahal@example.com	c270117dc16e5d7ece1d268fdbbc56067753c2efc3ef1c785aaa13eb808a17a3fc41324d319ea529c692ab05a8b7142bd9022ba484b9b5b8470479c3706d0e22.ebb595969366d3d425cd422a6e5cb955	Binod	Dahal	doctor	2025-07-04 11:33:46.170243
25	pramila.pandey@example.com	b817fb59f683cc2d888adc9c17eb465653e3af210d22f0c761dfd839b01dff5fd72f28a1691a45b9746726077826842ccf9fa67e41515c87a883394b044949cf.c0be0ccec6972b2aeeef24146448d0c6	Pramila	Pandey	doctor	2025-07-04 11:33:46.212919
26	bbb@gmail.com	fead4f20558609ae6059c5e4510e8412fb821e3f4ec9c70ccabcec2603576f7576716e359376846c7984c65938119306bc43b5408041893a814c12b581afd0e5.a0bb1a1b7534a54f9bb334cf88b1c16a	bbb	bbb	patient	2025-07-04 11:37:04.670559
\.


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.appointments_id_seq', 2, true);


--
-- Name: availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.availability_id_seq', 1096, true);


--
-- Name: doctor_symptoms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.doctor_symptoms_id_seq', 100, true);


--
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.doctors_id_seq', 25, true);


--
-- Name: health_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.health_records_id_seq', 1, false);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.patients_id_seq', 1, true);


--
-- Name: reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.reminders_id_seq', 1, false);


--
-- Name: specialties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.specialties_id_seq', 1, false);


--
-- Name: symptoms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.symptoms_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medimatch
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: availability availability_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_pkey PRIMARY KEY (id);


--
-- Name: doctor_symptoms doctor_symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctor_symptoms
    ADD CONSTRAINT doctor_symptoms_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: health_records health_records_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.health_records
    ADD CONSTRAINT health_records_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: specialties specialties_name_unique; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_name_unique UNIQUE (name);


--
-- Name: specialties specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_pkey PRIMARY KEY (id);


--
-- Name: symptoms symptoms_name_unique; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_name_unique UNIQUE (name);


--
-- Name: symptoms symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: medimatch
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: appointments appointments_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: appointments appointments_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: availability availability_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: doctor_symptoms doctor_symptoms_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctor_symptoms
    ADD CONSTRAINT doctor_symptoms_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: doctor_symptoms doctor_symptoms_symptom_id_symptoms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctor_symptoms
    ADD CONSTRAINT doctor_symptoms_symptom_id_symptoms_id_fk FOREIGN KEY (symptom_id) REFERENCES public.symptoms(id);


--
-- Name: doctors doctors_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: health_records health_records_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.health_records
    ADD CONSTRAINT health_records_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patients patients_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reminders reminders_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: medimatch
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- PostgreSQL database dump complete
--

