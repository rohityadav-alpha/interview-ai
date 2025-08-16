CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"skill" varchar(128),
	"difficulty" varchar(32),
	"correct" integer,
	"total" integer,
	"confidence" integer
);
