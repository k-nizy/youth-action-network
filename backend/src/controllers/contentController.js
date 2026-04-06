exports.getGallery = (req, res) => {
    const galleryData = [
        { src: "images/gallery/gallery_01.jpg", title: "Care & Help Community Outreach", location: "Kigali, Rwanda", description: "Care & Help Child Organization engaging with vulnerable children in the community", category: "community" },
        { src: "images/gallery/gallery_02.jpg", title: "Children's Education Program", location: "Kigali, Rwanda", description: "Supporting children's access to quality education and safe learning environments", category: "training" },
        { src: "images/gallery/gallery_03.jpg", title: "Youth Advocacy Session", location: "Kigali, Rwanda", description: "Young advocates coming together to champion children's rights", category: "events" },
        { src: "images/gallery/gallery_04.jpg", title: "Community Health Drive", location: "Kigali, Rwanda", description: "Holistic health and wellness support for children and families", category: "community" },
        { src: "images/gallery/gallery_05.jpg", title: "Child Protection Initiative", location: "Kigali, Rwanda", description: "Raising awareness about child safety and mental health", category: "community" },
        { src: "images/gallery/gallery_06.jpg", title: "Youth Leadership Workshop", location: "Kigali, Rwanda", description: "Developing leadership skills in the next generation of change-makers", category: "leadership" },
        { src: "images/gallery/gallery_07.jpg", title: "Network Partner Meeting", location: "Kigali, Rwanda", description: "YAN network partners coordinating impactful community programs", category: "events" },
        { src: "images/gallery/gallery_08.jpg", title: "Community Day Celebration", location: "Kigali, Rwanda", description: "Celebrating milestones in youth advocacy and community transformation", category: "events" },
        { src: "images/gallery/gallery_09.jpg", title: "Skills Training Program", location: "Kigali, Rwanda", description: "Capacity building and professional skills development for youth leaders", category: "training" },
        { src: "images/gallery/gallery_10.jpg", title: "Outreach & Support Visit", location: "Kigali, Rwanda", description: "Direct support services reaching the most vulnerable children and families", category: "community" },
        { src: "images/gallery/care-and-help.png", title: "Care & Help Child Organization", location: "Kigali, Rwanda", description: "Expanding support from 35 to 574 vulnerable children through holistic programs", category: "community" },
        { src: "images/gallery/oazis-health.png", title: "OAZIS Health Initiative", location: "Rwanda", description: "Training 850+ healthcare providers and engaging 500,000+ people in awareness campaigns", category: "training" },
        { src: "images/what_if_rwanda.png", title: "WHAT IF-Rwanda Program", location: "Iramiro Center, Rwanda", description: "Providing water access, school fees, and mentorship for children at Iramiro Center", category: "community" },
        { src: "images/gallery/aspire-debate2.png", title: "Aspire Debate Rwanda", location: "Rwanda", description: "Pioneering national and East African university debating championships", category: "leadership" },
        { src: "images/gallery/ifg2.png", title: "Informed Future Generations", location: "Rwanda", description: "Reaching 5,000+ students through school clubs with 40,000+ online views", category: "training" },
        { src: "images/care_help.png", title: "YAN Network Team", location: "Kigali, Rwanda", description: "The Youth Advocates Network team driving change across Rwanda", category: "leadership" }
    ];

    res.status(200).json({
        success: true,
        data: galleryData
    });
};

exports.getImpact = (req, res) => {
    const impactRatingsData = [
        {
            rating: "PLATINUM",
            organization: "Aspire Debate Rwanda",
            evidence: "Partnerships with 50+ secondary schools and 22 higher learning institutions; pioneered national and East African university debating championships; established since 2014 with systemic reach across Rwanda's education sector."
        },
        {
            rating: "PLATINUM",
            organization: "Informed Future Generations (IFG)",
            evidence: "Reached 5,000+ students through school clubs; collaborations with RBC and district governments; conducted 50+ outreaches; 40,000+ online views; founded in 2023 with remarkable rapid scaling."
        },
        {
            rating: "PLATINUM",
            organization: "Helping Heart Family Rwanda (HHFR)",
            evidence: "Supported 500+ children in education; legal aid to 10,000+ individuals; successfully reintegrated 50 former street children with families; founded in 2021 with deep, measurable community impact."
        },
        {
            rating: "GOLD",
            organization: "OAZIS Health",
            evidence: "Trained 850+ healthcare providers; engaged 500,000+ people in awareness campaigns; supported 720 digital health innovators; founded in 2020 with impressive scale in training and awareness."
        },
        {
            rating: "GOLD",
            organization: "Rwanda We Want Organization (RWW)",
            evidence: "Empowered 100+ graduates through leadership program; addressed intergenerational trauma for 126 individuals; reached 2,000+ youth with SRH education; registered NGO since 2015 with strong sustainability."
        },
        {
            rating: "GOLD",
            organization: "Care and Help Child Organization",
            evidence: "Expanded from supporting 35 to 574 vulnerable children; demonstrates powerful growth through partnerships; holistic approach to education, safety, and mental health with deep community roots since 2018."
        },
        {
            rating: "GOLD",
            organization: "MINDORA HEALTH",
            evidence: "Reached 1,000+ young people with AI-driven mental health platform; strong partnerships with universities; innovative tech-forward approach positioned for massive scale; founded in 2022."
        },
        {
            rating: "GOLD",
            organization: "Heza Initiative",
            evidence: "Strategic partnerships with UNICEF, RBC, and NCDA; provides daily nutrition to 200 children; multi-pronged approach to nutrition, agriculture, and teen mother empowerment; founded in 2022."
        },
        {
            rating: "GOLD",
            organization: "WHAT IF- Rwanda",
            evidence: "Installed water tanks and filtration systems; consistent provision of school fees and materials; powerful mentorship program building \"families of the heart\" for children at Iramiro Center."
        },
        {
            rating: "BRONZE",
            organization: "Inshuti Health Organization (IHO)",
            evidence: "Strong community-driven programs like 'HER CHOICE' and 'Learn to Unlearn'; deep personal roots in Nyagatare District suggesting significant localized impact; founded in 2020."
        },
        {
            rating: "BRONZE",
            organization: "Nursing Research Club Organization",
            evidence: "Successfully hosted two annual nursing symposiums (2023, 2024); upcoming Rwamagana Health Connect (July 2025); focuses on professional development with growing community outreach; founded in 2021."
        },
        {
            rating: "BRONZE",
            organization: "Hope for Tomorrow",
            evidence: "Returned 20 girls to school on full scholarships; reached 300+ adolescents with SRHR information; founded in 2024 with targeted, effective impact in Nyamasheke District."
        },
        {
            rating: "BRONZE",
            organization: "Rise and Live Organization",
            evidence: "Powerful individual stories of transformation (e.g., 18-year-old teen mother now sending child to school); crucial mental and reproductive health support for teen mothers in Huye."
        },
        {
            rating: "BRONZE",
            organization: "University of Rwanda Public Health Students' Association (URPHSA)",
            evidence: "Well-established student association since 2017; bridges academic knowledge with community action across NCDs, SRHR, and WASH; provides vital services through student-led initiatives."
        },
        {
            rating: "BRONZE",
            organization: "Studio Shodwe",
            evidence: "Amplifies powerful independent youth voices (e.g., Vidha Kabera, Cynthia Umutoni); focuses on breaking stigmas around mental health and orphanhood through storytelling and advocacy."
        }
    ];

    res.status(200).json({
        success: true,
        data: impactRatingsData
    });
};
