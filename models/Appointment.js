// const { DataTypes } = require('sequelize');

module.exports = (sequelize,DataTypes) => {
    const Appointment = sequelize.define('Appointment', {
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'students',
                key: 'id'
            }
        },
        slotId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'availableslots',
                key: 'slotid'
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
        eid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'exams',
                key: 'eid'
            }
        },
        cid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'cid'
            }
        },
        date: {
            type: DataTypes.STRING,
            allowNull: false
        },
        FromTime: {
            type: DataTypes.STRING,
            allowNull: false
        },
        EndTime: {
            type: DataTypes.STRING,
            allowNull: false
        },
        evaluation_info: {
            type: DataTypes.STRING
        },
        Status: {
            type: DataTypes.STRING
        }
    }, {
        timestamps: false
    });

    return Appointment;
};