import { Sequelize } from "sequelize-typescript";
import { Config } from "../utils/config";
import Logger from "../utils/log";
import { Account, AccountPunishment, AccountRank } from "./models/accounts";

//IDK if its good to keep this naming in typescript but whatever
export type AccountToken = {
    AccountId: number;
    Name: string,
    Rank: string,
    DonorToken: DonorToken,
    Time: number,
    Punishments: PunishmentToken[];
}

export type AccountTransactionToken = {
    Date: string,
    SalesPackageName: string,
    Gems: number,
    Coins: number
}

export type CoinTransactionToken = {
    Date: string,
    Source: string,
    Amount: number
}

export type CustomBuildToken = {
}

export type PetToken = {
    PetName: string,
    PetType: string
}

export type DonorToken = {
    Gems: number,
    Coins: number,
    Donated: boolean,
    SalesPackages: number[],
    UnknownSalesPackages: string[],
    Transactions: AccountTransactionToken[],
    CoinRewards: CoinTransactionToken[],
    //TODO: Custom Builds
    CustomBuilds: CustomBuildToken[], 
    Pets: PetToken[],
    PetNameTagCount: number
}

export type PunishmentToken = {
    PunishmentId: number,
    Admin: string,
    Time: number,
    Sentence: string,
    Category: string,
    Reason: string,
    Severity: number,
    Duration: number,
    Removed: boolean,
    RemoveAdmin: string,
    RemoveReason: string,
    Active: boolean,
}

export class DatabaseManager {

    private static sequelize: Sequelize;
    public static readonly logger: Logger = new Logger("Database");

    public static async init() {
        const databaseConnectionConfig = Config.config.databaseConnection;
        this.sequelize = new Sequelize({
            host: databaseConnectionConfig.address,
            port: databaseConnectionConfig.port,
            username: databaseConnectionConfig.username,
            password: databaseConnectionConfig.password,
            dialect: "mysql",
            models: [Account, AccountPunishment, AccountRank],
            database: "account"
        });

        try{
            await this.sequelize.authenticate();
            DatabaseManager.logger.log(`Successfully connected to ${databaseConnectionConfig.address}:${databaseConnectionConfig.port} as ${databaseConnectionConfig.username}`);
        }catch(ex){
            DatabaseManager.logger.log(`There was an issue connecting to ${databaseConnectionConfig.address}:${databaseConnectionConfig.port}. Shutting down...`)
            process.exit(0);
        }

    }

    public static async getAccountByName(name: string): Promise<Account | undefined>{
        const account = await Account.findAll({
            where: {
                name: name
            }
        });
        if(account.length < 1){
            return;
        }
        return account[0];
    }

    public static async getAccountByUUID(uuid: string): Promise<Account | undefined>{
        const account = await Account.findAll({
            where: {
                uuid: uuid
            }
        });
        if(account.length < 1){
            return;
        }
        return account[0];
    }


    //TODO: Caching...?
    public static async getAccountToken(account: Account){
        const accountToken: AccountToken = {
            AccountId: account.id,
            Name: account.name,
            Rank: "PLAYER", //Defaulted
            Punishments: [],
            Time: Date.now(),
            DonorToken: {
                Gems: account.gems,
                Coins: account.coins,
                Donated: false,
                SalesPackages: [],
                UnknownSalesPackages: [],
                Transactions: [],
                CoinRewards: [],
                CustomBuilds: [],
                Pets: [],
                PetNameTagCount: 0
            }
        }

        //LoadRank
        const accountRank = await AccountRank.findAll({
            where: {
                accountId: account.id,
            }
        })
        if(accountRank.length > 0){
            accountToken.Rank = accountRank[0].rankIdentifier;
        }

        //Load Punishment
        const punishments = await AccountPunishment.findAll({
            where: {
                target: account.name
            }
        })

        if(punishments.length > 0){
            accountToken.Punishments = punishments.map(punishment => {
                const isActive = Date.now() < punishment.time.getTime() - punishment.duration * 3600000 && !punishment.removed;
                return {
                    PunishmentId: punishment.id,
                    Admin: punishment.admin,
                    Time: punishment.time.getTime(),
                    Sentence: punishment.sentence,
                    Category: punishment.category,
                    Reason: punishment.reason,
                    Severity: punishment.severity,
                    Duration: punishment.duration,
                    Active: isActive,
                    Removed: punishment.removed,
                    RemoveAdmin: punishment.removedAdmin,
                    RemoveReason: punishment.removedReason
                } as PunishmentToken
            })
        }
        return accountToken;
    }
}