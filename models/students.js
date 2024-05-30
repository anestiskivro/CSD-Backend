// const sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Students = sequelize.define("Students", {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        student_number: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        Status: {
            type: DataTypes.STRING,
        },

    }, {
        timestamps: false
    });
    return Students;
};
