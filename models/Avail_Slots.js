// const { DataTypes } = require("sequelize");

module.exports = (sequelize,DataTypes) => {
    const AvailableSlots = sequelize.define("AvailableSlots", {
        slotid: {
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
        eid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'exams',
                key: 'eid'
            }
        },
        taid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'teachingassistants',
                key: 'taid'
            }
        },
        date: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        fromTime: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        EndTime: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        Status: {
            type: DataTypes.STRING
        }

    }, {
        timestamps: false
    });

    return AvailableSlots;
};