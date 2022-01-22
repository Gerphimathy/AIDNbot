CREATE TABLE reminders(
id SERIAL PRIMARY KEY ,
userID VARCHAR(30) NOT NULL,
remindTime TIMESTAMPTZ,
message VARCHAR(255)
);

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    discordId VARCHAR(30) NOT NULL,
    serverId VARCHAR(30) NOT NULL,
    isDm boolean
);

CREATE TABLE characters(
    id SERIAL PRIMARY KEY,
    description TEXT,
    level INT,
    exp INT,
    HP INT,
    SP INT,
    MP INT,
    ATK INT,
    ARM INT,
    MAG INT,
    RES INT,
    SOC INT,

    extra INT
);

CREATE TABLE rel_user_character(
    userId INT NOT NULL,
    characterId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES  users(id),
    FOREIGN KEY (characterId) REFERENCES  characters(id),
    PRIMARY KEY (userId, characterId)
);