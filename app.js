const superagent = require('superagent');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer')
const params = require('./config')
const {
    isFinish
} = require('./util')

//完成之后邮箱通知填写完成
async function main({
    str,
    qq
}) {
    console.log(str, qq)
    let transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: {
            user: "2273049646@qq.com",
            pass: "nlmnrkmffzbvebhj",
        },
    });

    await transporter.sendMail({
        from: '2273049646@qq.com', // sender address
        to: qq, // list of receivers
        subject: "疫情登记", // Subject line
        text: str, // plain text body
    }, (err, res) => {
        console.log(err, res)
    })
}

main({
    str: '填写成功',
    qq: '2273049646@qq.com'
})
//填写报表的数据
const getAllPromise = async (param) => {
    //获取登陆页面
    let resLogin = await superagent.get("http://xgb.ahstu.edu.cn/SPCP/Web/")
    const $ = cheerio.load(resLogin.text);
    //获取登陆登陆信息
    let ReSubmiteFlag = $('input[name="ReSubmiteFlag"]').val()
    let StuLoginMode = $('input[name="StuLoginMode"]').val()


    //确认学生信息
    const agent = superagent.agent();
    await agent.post("http://xgb.ahstu.edu.cn/SPCP/Web/Account/CheckUser")
        .send({
            "stuId": param.txtUid,
            "stuName": param.txtPwd
        })


    //登陆到页面中去，拿到Cookie
    await agent.post('http://xgb.ahstu.edu.cn/SPCP/Web/')
        .send({
            ReSubmiteFlag,
            StuLoginMode,
            txtUid: param.txtUid,
            txtPwd: param.txtPwd
        })
    //数据填报的页面1,2,3,4的界面
    await agent.get('http://xgb.ahstu.edu.cn/SPCP/Web/Account/ChooseSys')

    //填写详细信息的界面
    let resToReport = await agent.get("http://xgb.ahstu.edu.cn/SPCP/Web/Report/Index")
    let resT = resToReport.text
    if (isFinish(resToReport.text)) {
        return main({
            str: '填写成功',
            qq: param.qq
        })
    }
    //获取数据,处理成后台需要的数据
    const _$ = cheerio.load(resT);
    let StudentId = _$('input[name="StudentId"]').val()
    let Name = _$('input[name="Name"]').val()
    let Sex = _$('input[name="Sex"]').val()
    let SpeType = _$('input[name="SpeType"]').val()
    let CollegeNo = _$('input[name="CollegeNo"]').val()
    let SpeGrade = _$('input[name="SpeGrade"]').val()
    let SpecialtyName = _$('input[name="SpecialtyName"]').val()
    let ClassName = _$('input[name="ClassName"]').val()
    let MoveTel = _$('input[name="MoveTel"]').val()
    // let Province = 340000 //安徽省
    let Province = _$('select[name="Province"]').children('option:selected').val() || param.Province
    // let City = 340300 //蚌埠
    let City = _$('select[name="City"]').attr('data-defaultValue') || param.City
    // let County = 340302 //龙子湖区
    let County = _$('select[name="County"]').attr('data-defaultValue') || param.County
    let ComeWhere = _$('input[name="ComeWhere"]').val() || param.ComeWhere //黄山大道
    // let FaProvince = 340000 //安徽省
    let FaProvince = _$('select[name="FaProvince"]').children('option:selected').val() || param.FaProvince
    // let FaCity = 341200 //阜阳
    let FaCity = _$('select[name="FaCity"]').attr('data-defaultValue') || param.FaCity
    // let FaCounty = 341221 //临泉
    let FaCounty = _$('select[name="FaCounty"]').attr('data-defaultValue') || param.FaCounty
    let FaComeWhere = _$('input[name="FaComeWhere"]').val() || param.FaComeWhere //详细地址
    let radio_s = {}
    for (let i = 1; i < 14; i++) {
        let item = 'radio_' + i
        radio_s[item] = _$(`input[name=${item}][checked="checked"]`).val()
    }
    let GetAreaUrl = _$('input[name="GetAreaUrl"]').val()
    let IdCard = _$('input[name="IdCard"]').val()
    let ProvinceName = _$('input[name="ProvinceName"]').val()
    let CityName = _$('input[name="CityName"]').val()
    let CountyName = _$('input[name="CountyName"]').val()
    let FaProvinceName = _$('input[name="FaProvinceName"]').val()
    let FaCityName = _$('input[name="FaCityName"]').val()
    let FaCountyName = _$('input[name="FaCountyName"]').val()
    let radioCount = _$('input[name="radioCount"]').val()
    let checkboxCount = _$('input[name="checkboxCount"]').val()
    let blackCount = _$('input[name="blackCount"]').val()
    let newReSubmiteFlag = _$('input[name="ReSubmiteFlag"]').val()
    let PZData = []
    for (let i = 1; i < 14; i++) {
        let item = 'radio_' + i
        PZData.push({
            "OptionName": _$(`input[name=${item}][checked="checked"]`).attr("data-optionname"),
            "SelectId": radio_s[item],
            "TitleId": _$(`input[name=${item}][checked="checked"]`).parent().attr("data-tid"),
            "OptionType": "0"
        })
    }

    let sendParams = {
        StudentId,
        Name,
        Sex,
        SpeType,
        CollegeNo,
        SpeGrade,
        SpecialtyName,
        ClassName,
        MoveTel,
        Province,
        City,
        County,
        ComeWhere,
        FaProvince,
        FaCity,
        FaCounty,
        FaComeWhere,
        ...radio_s,
        Other: GetAreaUrl,
        GetAreaUrl,
        IdCard,
        ProvinceName,
        CityName,
        CountyName,
        FaProvinceName,
        FaCityName,
        FaCountyName,
        radioCount,
        checkboxCount,
        blackCount,
        PZData,
        newReSubmiteFlag,
    }
    let resReport = await agent.post("http://xgb.ahstu.edu.cn/SPCP/Web/Report/Index")
        .send(sendParams)

    if (isFinish(resReport.text)) {
        main({
            str: '填写成功',
            qq: param.qq
        })
    } else {
        main({
            str: '填写失败',
            qq: param.qq
        })
    }
}

var CronJob = require('cron').CronJob;
const job = new CronJob('59 45 8 * * *', function () {
    //执行多次填写的程序
    for (let i = 0; i < params.length; i++) {
        // getAllPromise(params[i])
    }
})
job.start();