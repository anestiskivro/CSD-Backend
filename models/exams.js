// const { DataTypes } = require("sequelize");

module.exports = (sequelize,DataTypes) => {
    const Exams = sequelize.define("Exams", {
        eid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        cid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'cid'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        FromDate: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        ToDate: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        duration: {
            type: DataTypes.STRING,
        },
        Status: {
            type: DataTypes.STRING
        }

    }, {
        timestamps: false
    });

    return Exams;
};